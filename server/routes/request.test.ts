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
