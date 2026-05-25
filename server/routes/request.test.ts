import { MediaRequestStatus } from '@server/constants/media';
import { hasPermission, Permission } from '@server/lib/permissions';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock getRepository from datasource — must be hoisted before any code that
// might transitively import entities with TypeORM decorators.
const mockFindOneOrFail = vi.fn();
const mockSave = vi.fn();
vi.mock('@server/datasource', () => ({
  getRepository: vi.fn(() => ({
    findOneOrFail: mockFindOneOrFail,
    save: mockSave,
  })),
}));

// Mock logger to avoid side effects
vi.mock('@server/logger', () => ({
  default: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

/**
 * Helper: creates a mock user with the given permissions bitmask.
 * Mirrors the User entity's hasPermission method.
 */
function createMockUser(permissions: number, id = 1) {
  return {
    id,
    permissions,
    hasPermission(
      perms: Permission | Permission[],
      options?: { type: 'and' | 'or' }
    ): boolean {
      return hasPermission(perms, this.permissions, options);
    },
  };
}

/**
 * Helper: creates a mock MediaRequest-like object.
 */
function createMockRequest(
  status: MediaRequestStatus,
  id = 1,
  requestedById = 10
) {
  return {
    id,
    status,
    requestedBy: { id: requestedById },
    modifiedBy: null as unknown,
  };
}

/**
 * Helper: creates Express req/res/next mocks.
 */
function createExpressMocks(overrides: {
  params?: Record<string, string>;
  user?: ReturnType<typeof createMockUser> | null;
}) {
  const req = {
    params: overrides.params ?? {},
    user: overrides.user ?? null,
  } as unknown as Request;

  const resJson = vi.fn();
  const resStatus = vi.fn(() => ({ json: resJson }));
  const res = { status: resStatus, json: resJson } as unknown as Response;

  const next = vi.fn();

  return { req, res, resStatus, resJson, next };
}

/**
 * Reproduces the POST /:requestId/:status handler logic from request.ts
 * so we can unit-test it without spinning up Express or triggering the
 * full TypeORM entity import chain.
 */
async function statusChangeHandler(
  req: Request,
  res: Response,
  next: (err?: unknown) => void
) {
  const { getRepository } = await import('@server/datasource');
  const { default: logger } = await import('@server/logger');

  const requestRepository = getRepository({} as never);

  try {
    const request = (await requestRepository.findOneOrFail({
      where: { id: Number(req.params.requestId) },
      relations: { requestedBy: true, modifiedBy: true },
    })) as { status: MediaRequestStatus | undefined; modifiedBy: unknown };

    let newStatus: MediaRequestStatus | undefined;

    switch (req.params.status) {
      case 'pending':
        newStatus = MediaRequestStatus.PENDING;
        break;
      case 'approve':
        newStatus = MediaRequestStatus.APPROVED;
        break;
      case 'decline':
        newStatus = MediaRequestStatus.DECLINED;
        break;
    }

    request.status = newStatus;
    request.modifiedBy = req.user;
    await requestRepository.save(request);

    return (res.status(200) as unknown as Response).json(request);
  } catch (e: unknown) {
    logger.error('Error processing request update', {
      label: 'Media Request',
      message: (e as Error).message,
    });
    next({ status: 404, message: 'Request not found.' });
  }
}

/**
 * Reproduces the isAuthenticated middleware from @server/middleware/auth
 * to test the permission gate that protects approve/decline routes.
 */
function isAuthenticated(
  permissions: Permission | Permission[]
): (req: Request, res: Response, next: () => void) => void {
  return (req, res, next) => {
    if (!req.user || !req.user.hasPermission(permissions ?? 0)) {
      res.status(403).json({
        status: 403,
        error: 'You do not have permission to access this endpoint',
      });
    } else {
      next();
    }
  };
}

describe('Request approval and denial route handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Permission checks (isAuthenticated middleware) ───────────────

  describe('permission checks', () => {
    it('blocks regular users without MANAGE_REQUESTS permission', () => {
      const middleware = isAuthenticated(Permission.MANAGE_REQUESTS);
      const regularUser = createMockUser(Permission.REQUEST);
      const { req, res, resStatus, next } = createExpressMocks({
        user: regularUser,
      });

      const resJson = vi.fn();
      resStatus.mockReturnValue({ json: resJson });

      middleware(req, res, next);

      expect(resStatus).toHaveBeenCalledWith(403);
      expect(resJson).toHaveBeenCalledWith(
        expect.objectContaining({ status: 403 })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('allows users with MANAGE_REQUESTS permission', () => {
      const middleware = isAuthenticated(Permission.MANAGE_REQUESTS);
      const managerUser = createMockUser(Permission.MANAGE_REQUESTS);
      const { req, res, next } = createExpressMocks({ user: managerUser });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('allows admin users (admin overrides all permissions)', () => {
      const middleware = isAuthenticated(Permission.MANAGE_REQUESTS);
      const adminUser = createMockUser(Permission.ADMIN);
      const { req, res, next } = createExpressMocks({ user: adminUser });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('blocks unauthenticated requests (no user on req)', () => {
      const middleware = isAuthenticated(Permission.MANAGE_REQUESTS);
      const { req, res, resStatus, next } = createExpressMocks({
        user: null,
      });

      const resJson = vi.fn();
      resStatus.mockReturnValue({ json: resJson });

      middleware(req, res, next);

      expect(resStatus).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('blocks users who only have REQUEST permission (not MANAGE_REQUESTS)', () => {
      const middleware = isAuthenticated(Permission.MANAGE_REQUESTS);
      const requestOnlyUser = createMockUser(
        Permission.REQUEST | Permission.VOTE
      );
      const { req, res, resStatus, next } = createExpressMocks({
        user: requestOnlyUser,
      });

      const resJson = vi.fn();
      resStatus.mockReturnValue({ json: resJson });

      middleware(req, res, next);

      expect(resStatus).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── Approval flow ───────────────────────────────────────────────

  describe('approval flow (POST /:requestId/approve)', () => {
    it('approves a PENDING request — status becomes APPROVED', async () => {
      const mockMediaRequest = createMockRequest(MediaRequestStatus.PENDING);
      mockFindOneOrFail.mockResolvedValue(mockMediaRequest);
      mockSave.mockResolvedValue(mockMediaRequest);

      const managerUser = createMockUser(Permission.MANAGE_REQUESTS);
      const { req, res, resStatus, resJson, next } = createExpressMocks({
        params: { requestId: '1', status: 'approve' },
        user: managerUser,
      });
      resStatus.mockReturnValue({ json: resJson });

      await statusChangeHandler(req, res, next);

      expect(mockMediaRequest.status).toBe(MediaRequestStatus.APPROVED);
      expect(mockMediaRequest.modifiedBy).toBe(managerUser);
      expect(mockSave).toHaveBeenCalledWith(mockMediaRequest);
      expect(resStatus).toHaveBeenCalledWith(200);
    });

    it('allows approving a DECLINED request (no transition guard in handler)', async () => {
      const mockMediaRequest = createMockRequest(MediaRequestStatus.DECLINED);
      mockFindOneOrFail.mockResolvedValue(mockMediaRequest);
      mockSave.mockResolvedValue(mockMediaRequest);

      const managerUser = createMockUser(Permission.MANAGE_REQUESTS);
      const { req, res, resStatus, resJson, next } = createExpressMocks({
        params: { requestId: '2', status: 'approve' },
        user: managerUser,
      });
      resStatus.mockReturnValue({ json: resJson });

      await statusChangeHandler(req, res, next);

      expect(mockMediaRequest.status).toBe(MediaRequestStatus.APPROVED);
      expect(mockSave).toHaveBeenCalled();
      expect(resStatus).toHaveBeenCalledWith(200);
    });

    it('allows approving a COMPLETED request (no transition guard in handler)', async () => {
      const mockMediaRequest = createMockRequest(MediaRequestStatus.COMPLETED);
      mockFindOneOrFail.mockResolvedValue(mockMediaRequest);
      mockSave.mockResolvedValue(mockMediaRequest);

      const adminUser = createMockUser(Permission.ADMIN);
      const { req, res, resStatus, resJson, next } = createExpressMocks({
        params: { requestId: '3', status: 'approve' },
        user: adminUser,
      });
      resStatus.mockReturnValue({ json: resJson });

      await statusChangeHandler(req, res, next);

      expect(mockMediaRequest.status).toBe(MediaRequestStatus.APPROVED);
      expect(mockSave).toHaveBeenCalled();
    });

    it('returns 404 when the request does not exist', async () => {
      mockFindOneOrFail.mockRejectedValue(new Error('Entity not found'));

      const managerUser = createMockUser(Permission.MANAGE_REQUESTS);
      const { req, res, next } = createExpressMocks({
        params: { requestId: '999', status: 'approve' },
        user: managerUser,
      });

      await statusChangeHandler(req, res, next);

      expect(next).toHaveBeenCalledWith({
        status: 404,
        message: 'Request not found.',
      });
    });
  });

  // ─── Denial flow ─────────────────────────────────────────────────

  describe('denial flow (POST /:requestId/decline)', () => {
    it('declines a PENDING request — status becomes DECLINED', async () => {
      const mockMediaRequest = createMockRequest(MediaRequestStatus.PENDING);
      mockFindOneOrFail.mockResolvedValue(mockMediaRequest);
      mockSave.mockResolvedValue(mockMediaRequest);

      const managerUser = createMockUser(Permission.MANAGE_REQUESTS);
      const { req, res, resStatus, resJson, next } = createExpressMocks({
        params: { requestId: '1', status: 'decline' },
        user: managerUser,
      });
      resStatus.mockReturnValue({ json: resJson });

      await statusChangeHandler(req, res, next);

      expect(mockMediaRequest.status).toBe(MediaRequestStatus.DECLINED);
      expect(mockMediaRequest.modifiedBy).toBe(managerUser);
      expect(mockSave).toHaveBeenCalledWith(mockMediaRequest);
      expect(resStatus).toHaveBeenCalledWith(200);
    });

    it('declines an APPROVED request — status changes to DECLINED', async () => {
      const mockMediaRequest = createMockRequest(MediaRequestStatus.APPROVED);
      mockFindOneOrFail.mockResolvedValue(mockMediaRequest);
      mockSave.mockResolvedValue(mockMediaRequest);

      const adminUser = createMockUser(Permission.ADMIN);
      const { req, res, resStatus, resJson, next } = createExpressMocks({
        params: { requestId: '4', status: 'decline' },
        user: adminUser,
      });
      resStatus.mockReturnValue({ json: resJson });

      await statusChangeHandler(req, res, next);

      expect(mockMediaRequest.status).toBe(MediaRequestStatus.DECLINED);
      expect(mockSave).toHaveBeenCalled();
      expect(resStatus).toHaveBeenCalledWith(200);
    });

    it('returns 404 when the request does not exist', async () => {
      mockFindOneOrFail.mockRejectedValue(new Error('Entity not found'));

      const managerUser = createMockUser(Permission.MANAGE_REQUESTS);
      const { req, res, next } = createExpressMocks({
        params: { requestId: '999', status: 'decline' },
        user: managerUser,
      });

      await statusChangeHandler(req, res, next);

      expect(next).toHaveBeenCalledWith({
        status: 404,
        message: 'Request not found.',
      });
    });
  });

  // ─── Pending (re-set to pending) flow ────────────────────────────

  describe('pending flow (POST /:requestId/pending)', () => {
    it('sets an APPROVED request back to PENDING', async () => {
      const mockMediaRequest = createMockRequest(MediaRequestStatus.APPROVED);
      mockFindOneOrFail.mockResolvedValue(mockMediaRequest);
      mockSave.mockResolvedValue(mockMediaRequest);

      const managerUser = createMockUser(Permission.MANAGE_REQUESTS);
      const { req, res, resStatus, resJson, next } = createExpressMocks({
        params: { requestId: '1', status: 'pending' },
        user: managerUser,
      });
      resStatus.mockReturnValue({ json: resJson });

      await statusChangeHandler(req, res, next);

      expect(mockMediaRequest.status).toBe(MediaRequestStatus.PENDING);
      expect(mockSave).toHaveBeenCalled();
      expect(resStatus).toHaveBeenCalledWith(200);
    });
  });

  // ─── modifiedBy tracking ─────────────────────────────────────────

  describe('modifiedBy tracking', () => {
    it('records the acting user as modifiedBy on approval', async () => {
      const mockMediaRequest = createMockRequest(MediaRequestStatus.PENDING);
      mockFindOneOrFail.mockResolvedValue(mockMediaRequest);
      mockSave.mockResolvedValue(mockMediaRequest);

      const adminUser = createMockUser(Permission.ADMIN, 42);
      const { req, res, resStatus, resJson, next } = createExpressMocks({
        params: { requestId: '1', status: 'approve' },
        user: adminUser,
      });
      resStatus.mockReturnValue({ json: resJson });

      await statusChangeHandler(req, res, next);

      expect(mockMediaRequest.modifiedBy).toBe(adminUser);
      expect(
        (mockMediaRequest.modifiedBy as unknown as { id: number }).id
      ).toBe(42);
    });

    it('records the acting user as modifiedBy on decline', async () => {
      const mockMediaRequest = createMockRequest(MediaRequestStatus.PENDING);
      mockFindOneOrFail.mockResolvedValue(mockMediaRequest);
      mockSave.mockResolvedValue(mockMediaRequest);

      const managerUser = createMockUser(Permission.MANAGE_REQUESTS, 7);
      const { req, res, resStatus, resJson, next } = createExpressMocks({
        params: { requestId: '1', status: 'decline' },
        user: managerUser,
      });
      resStatus.mockReturnValue({ json: resJson });

      await statusChangeHandler(req, res, next);

      expect(mockMediaRequest.modifiedBy).toBe(managerUser);
      expect(
        (mockMediaRequest.modifiedBy as unknown as { id: number }).id
      ).toBe(7);
    });
  });

  // ─── MediaRequestStatus enum values ──────────────────────────────

  describe('MediaRequestStatus enum values', () => {
    it('has expected numeric values for status transitions', () => {
      expect(MediaRequestStatus.PENDING).toBe(1);
      expect(MediaRequestStatus.APPROVED).toBe(2);
      expect(MediaRequestStatus.DECLINED).toBe(3);
      expect(MediaRequestStatus.FAILED).toBe(4);
      expect(MediaRequestStatus.COMPLETED).toBe(5);
    });
  });

  // ─── Repository interaction ──────────────────────────────────────

  describe('repository interaction', () => {
    it('queries findOneOrFail with the correct requestId and relations', async () => {
      const mockMediaRequest = createMockRequest(MediaRequestStatus.PENDING);
      mockFindOneOrFail.mockResolvedValue(mockMediaRequest);
      mockSave.mockResolvedValue(mockMediaRequest);

      const managerUser = createMockUser(Permission.MANAGE_REQUESTS);
      const { req, res, resStatus, resJson, next } = createExpressMocks({
        params: { requestId: '42', status: 'approve' },
        user: managerUser,
      });
      resStatus.mockReturnValue({ json: resJson });

      await statusChangeHandler(req, res, next);

      expect(mockFindOneOrFail).toHaveBeenCalledWith({
        where: { id: 42 },
        relations: { requestedBy: true, modifiedBy: true },
      });
    });

    it('saves the updated request to the repository', async () => {
      const mockMediaRequest = createMockRequest(MediaRequestStatus.PENDING);
      mockFindOneOrFail.mockResolvedValue(mockMediaRequest);
      mockSave.mockResolvedValue(mockMediaRequest);

      const managerUser = createMockUser(Permission.MANAGE_REQUESTS);
      const { req, res, resStatus, resJson, next } = createExpressMocks({
        params: { requestId: '1', status: 'decline' },
        user: managerUser,
      });
      resStatus.mockReturnValue({ json: resJson });

      await statusChangeHandler(req, res, next);

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MediaRequestStatus.DECLINED,
          modifiedBy: managerUser,
        })
      );
    });

    it('returns the saved request as JSON in the response body', async () => {
      const mockMediaRequest = createMockRequest(MediaRequestStatus.PENDING);
      mockFindOneOrFail.mockResolvedValue(mockMediaRequest);
      mockSave.mockResolvedValue(mockMediaRequest);

      const managerUser = createMockUser(Permission.MANAGE_REQUESTS);
      const { req, res, resStatus, resJson, next } = createExpressMocks({
        params: { requestId: '1', status: 'approve' },
        user: managerUser,
      });
      resStatus.mockReturnValue({ json: resJson });

      await statusChangeHandler(req, res, next);

      expect(resJson).toHaveBeenCalledWith(mockMediaRequest);
    });
  });
});

describe('DELETE /request/:requestId, deleted media status restoration', () => {
  async function seedDeletedMediaScenario() {
    const userRepo = getRepository(User);
    const mediaRepo = getRepository(Media);
    const requestRepo = getRepository(MediaRequest);

    const admin = await userRepo.findOneOrFail({
      where: { email: 'admin@seerr.dev' },
    });

    const media = await mediaRepo.save(
      new Media({
        mediaType: MediaType.MOVIE,
        tmdbId: 99001,
        status: MediaStatus.DELETED,
        status4k: MediaStatus.UNKNOWN,
      })
    );

    const staleRequest = await requestRepo.save(
      new MediaRequest({
        type: MediaType.MOVIE,
        status: MediaRequestStatus.COMPLETED,
        media,
        requestedBy: admin,
        is4k: false,
        isAutoRequest: true,
      })
    );

    media.status = MediaStatus.PENDING;
    await mediaRepo.save(media);

    const newRequest = await requestRepo.save(
      new MediaRequest({
        type: MediaType.MOVIE,
        status: MediaRequestStatus.APPROVED,
        media,
        requestedBy: admin,
        is4k: false,
      })
    );

    return { media, staleRequest, newRequest, admin };
  }

  it('restores media status to DELETED when the re-request is deleted and a stale completed request remains', async () => {
    const mediaRepo = getRepository(Media);
    const { media, newRequest } = await seedDeletedMediaScenario();

    const agent = await loginAs('admin@seerr.dev', 'test1234');
    const res = await agent.delete(`/request/${newRequest.id}`);

    assert.strictEqual(res.status, 204);

    const updated = await mediaRepo.findOneOrFail({ where: { id: media.id } });
    assert.strictEqual(updated.status, MediaStatus.DELETED);
  });

  it('restores media status4k to DELETED when the re-request is deleted and a stale completed request remains', async () => {
    const userRepo = getRepository(User);
    const mediaRepo = getRepository(Media);
    const requestRepo = getRepository(MediaRequest);

    const admin = await userRepo.findOneOrFail({
      where: { email: 'admin@seerr.dev' },
    });

    const media = await mediaRepo.save(
      new Media({
        mediaType: MediaType.MOVIE,
        tmdbId: 99003,
        status: MediaStatus.UNKNOWN,
        status4k: MediaStatus.DELETED,
      })
    );

    await requestRepo.save(
      new MediaRequest({
        type: MediaType.MOVIE,
        status: MediaRequestStatus.COMPLETED,
        media,
        requestedBy: admin,
        is4k: true,
        isAutoRequest: true,
      })
    );

    media.status4k = MediaStatus.PENDING;
    await mediaRepo.save(media);

    const newRequest = await requestRepo.save(
      new MediaRequest({
        type: MediaType.MOVIE,
        status: MediaRequestStatus.APPROVED,
        media,
        requestedBy: admin,
        is4k: true,
      })
    );

    const agent = await loginAs('admin@seerr.dev', 'test1234');
    const res = await agent.delete(`/request/${newRequest.id}`);

    assert.strictEqual(res.status, 204);

    const updated = await mediaRepo.findOneOrFail({ where: { id: media.id } });
    assert.strictEqual(updated.status4k, MediaStatus.DELETED);
  });

  it('resets media status to UNKNOWN when the stale completed request is also deleted', async () => {
    const mediaRepo = getRepository(Media);
    const requestRepo = getRepository(MediaRequest);
    const { media, newRequest, staleRequest } =
      await seedDeletedMediaScenario();

    const agent = await loginAs('admin@seerr.dev', 'test1234');

    await agent.delete(`/request/${newRequest.id}`);

    const res = await agent.delete(`/request/${staleRequest.id}`);
    assert.strictEqual(res.status, 204);

    const updated = await mediaRepo.findOneOrFail({ where: { id: media.id } });
    assert.strictEqual(updated.status, MediaStatus.UNKNOWN);

    const remaining = await requestRepo.find({
      where: { media: { id: media.id } },
    });
    assert.strictEqual(remaining.length, 0);
  });

  it('resets media status4k to UNKNOWN when the stale completed 4K request is also deleted', async () => {
    const userRepo = getRepository(User);
    const mediaRepo = getRepository(Media);
    const requestRepo = getRepository(MediaRequest);

    const admin = await userRepo.findOneOrFail({
      where: { email: 'admin@seerr.dev' },
    });

    const media = await mediaRepo.save(
      new Media({
        mediaType: MediaType.MOVIE,
        tmdbId: 99004,
        status: MediaStatus.UNKNOWN,
        status4k: MediaStatus.DELETED,
      })
    );

    const staleRequest = await requestRepo.save(
      new MediaRequest({
        type: MediaType.MOVIE,
        status: MediaRequestStatus.COMPLETED,
        media,
        requestedBy: admin,
        is4k: true,
        isAutoRequest: true,
      })
    );

    media.status4k = MediaStatus.PENDING;
    await mediaRepo.save(media);

    const newRequest = await requestRepo.save(
      new MediaRequest({
        type: MediaType.MOVIE,
        status: MediaRequestStatus.APPROVED,
        media,
        requestedBy: admin,
        is4k: true,
      })
    );

    const agent = await loginAs('admin@seerr.dev', 'test1234');

    await agent.delete(`/request/${newRequest.id}`);

    const res = await agent.delete(`/request/${staleRequest.id}`);
    assert.strictEqual(res.status, 204);

    const updated = await mediaRepo.findOneOrFail({ where: { id: media.id } });
    assert.strictEqual(updated.status4k, MediaStatus.UNKNOWN);
  });

  it('does not reset media status when other active requests still exist', async () => {
    const userRepo = getRepository(User);
    const mediaRepo = getRepository(Media);
    const requestRepo = getRepository(MediaRequest);

    const admin = await userRepo.findOneOrFail({
      where: { email: 'admin@seerr.dev' },
    });

    const media = await mediaRepo.save(
      new Media({
        mediaType: MediaType.MOVIE,
        tmdbId: 99002,
        status: MediaStatus.PENDING,
        status4k: MediaStatus.UNKNOWN,
      })
    );

    const req1 = await requestRepo.save(
      new MediaRequest({
        type: MediaType.MOVIE,
        status: MediaRequestStatus.PENDING,
        media,
        requestedBy: admin,
        is4k: false,
      })
    );

    await requestRepo.save(
      new MediaRequest({
        type: MediaType.MOVIE,
        status: MediaRequestStatus.PENDING,
        media,
        requestedBy: admin,
        is4k: false,
      })
    );

    const agent = await loginAs('admin@seerr.dev', 'test1234');
    const res = await agent.delete(`/request/${req1.id}`);

    assert.strictEqual(res.status, 204);

    const updated = await mediaRepo.findOneOrFail({ where: { id: media.id } });
    assert.strictEqual(updated.status, MediaStatus.PENDING);
  });

  it('does not reset media status when status is PARTIALLY_AVAILABLE and only completed requests remain', async () => {
    const userRepo = getRepository(User);
    const mediaRepo = getRepository(Media);
    const requestRepo = getRepository(MediaRequest);

    const admin = await userRepo.findOneOrFail({
      where: { email: 'admin@seerr.dev' },
    });

    const media = await mediaRepo.save(
      new Media({
        mediaType: MediaType.MOVIE,
        tmdbId: 99005,
        status: MediaStatus.PARTIALLY_AVAILABLE,
        status4k: MediaStatus.UNKNOWN,
      })
    );

    const completedRequest = await requestRepo.save(
      new MediaRequest({
        type: MediaType.MOVIE,
        status: MediaRequestStatus.COMPLETED,
        media,
        requestedBy: admin,
        is4k: false,
      })
    );

    const agent = await loginAs('admin@seerr.dev', 'test1234');
    const res = await agent.delete(`/request/${completedRequest.id}`);

    assert.strictEqual(res.status, 204);

    const updated = await mediaRepo.findOneOrFail({ where: { id: media.id } });
    assert.strictEqual(updated.status, MediaStatus.PARTIALLY_AVAILABLE);
  });
});
