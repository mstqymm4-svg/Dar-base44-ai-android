import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const OWNED_ENTITIES = ['Favorite', 'AccountData'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Wipe only the records that belong to the caller.
    const wiped = {};
    await Promise.allSettled(
      OWNED_ENTITIES.map(async (name) => {
        const res = await base44.asServiceRole.entities[name].deleteMany({
          created_by_id: user.id,
        });
        wiped[name] = res?.deleted ?? res?.count ?? 0;
      })
    );

    // Finally remove the account itself (needs elevation).
    await base44.asServiceRole.entities.User.delete(user.id);

    return Response.json({ success: true, deleted: wiped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}