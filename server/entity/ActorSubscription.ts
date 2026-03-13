import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { DbAwareColumn } from '@server/utils/DbColumnHelper';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export type MediaFilter = 'all' | 'movie' | 'tv';
export type CreditType = 'cast' | 'crew' | 'both';
export type SubscriptionAction = 'request' | 'notify';

@Entity()
@Unique('UNIQUE_ACTOR_SUB', ['personId', 'subscribedBy'])
export class ActorSubscription {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @Index()
  public personId: number;

  @Column({ type: 'varchar' })
  public personName: string;

  @Column({ type: 'varchar', nullable: true })
  public profilePath: string | null;

  @Column({ type: 'varchar', default: 'all' })
  public mediaFilter: MediaFilter;

  @Column({ type: 'varchar', default: 'cast' })
  public creditType: CreditType;

  @Column({ type: 'float', default: 0 })
  public minImdbRating: number;

  @Column({ type: 'varchar', default: 'request' })
  public action: SubscriptionAction;

  @Column({ type: 'text', default: '[]' })
  public knownCreditIds: string;

  @ManyToOne(() => User, (user) => user.actorSubscriptions, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @Index()
  public subscribedBy: User;

  @DbAwareColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @DbAwareColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  public updatedAt: Date;

  @DbAwareColumn({ type: 'datetime', nullable: true })
  public lastSyncedAt: Date | null;

  constructor(init?: Partial<ActorSubscription>) {
    Object.assign(this, init);
  }

  public getKnownCreditIds(): string[] {
    try {
      return JSON.parse(this.knownCreditIds) as string[];
    } catch {
      return [];
    }
  }

  public setKnownCreditIds(ids: string[]): void {
    this.knownCreditIds = JSON.stringify(ids);
  }

  public static async deleteSubscription(
    id: number,
    user: User
  ): Promise<void> {
    const repo = getRepository(ActorSubscription);
    const sub = await repo.findOneBy({ id });

    if (!sub) {
      throw new Error('Subscription not found');
    }

    if (
      sub.subscribedBy.id !== user.id &&
      !user.hasPermission(Permission.ADMIN)
    ) {
      throw new Error('Not authorized');
    }

    await repo.delete(id);
  }
}

// Import at bottom to avoid circular dependency
import { Permission } from '@server/lib/permissions';
