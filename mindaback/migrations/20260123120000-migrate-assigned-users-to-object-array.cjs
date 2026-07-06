'use strict';

/**
 * Data migration: assigned_users from ["id1","id2"] to [{ user_id, status }]
 * status: pending | in-progress | re-assign | completed | rejected
 * @type {import('sequelize-cli').Migration}
 */
const VALID_STATUS = ['pending', 'in-progress', 're-assign', 'completed', 'rejected'];

function toNewFormat(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const first = arr[0];
  // Old: ["id1","id2"]
  if (typeof first === 'string') {
    return arr
      .filter((s) => typeof s === 'string' && s)
      .map((s) => ({ user_id: String(s), status: 'pending' }));
  }
  // Already/partial: [{ user_id, status? }] or [{ _id }]
  if (first && typeof first === 'object' && (first.user_id != null || first._id != null)) {
    return arr
      .map((o) => {
        const uid = o && (o.user_id ?? o._id);
        if (uid == null) return null;
        const st = o.status;
        return {
          user_id: String(uid),
          status: VALID_STATUS.includes(st) ? st : 'pending',
        };
      })
      .filter(Boolean);
  }
  return null;
}

function toOldFormat(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr
    .map((o) => (o && typeof o === 'object' && o.user_id != null ? o.user_id : null))
    .filter(Boolean);
}

module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT _id, assigned_users FROM template_masters WHERE assigned_users IS NOT NULL AND assigned_users != ''`
    );
    for (const r of rows || []) {
      let arr;
      try {
        arr = JSON.parse(r.assigned_users);
      } catch {
        continue;
      }
      const next = toNewFormat(arr);
      if (!next || next.length === 0) continue;
      const newVal = JSON.stringify(next);
      await queryInterface.sequelize.query(
        `UPDATE template_masters SET assigned_users = :val WHERE _id = :id`,
        { replacements: { val: newVal, id: r._id } }
      );
    }
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT _id, assigned_users FROM template_masters WHERE assigned_users IS NOT NULL AND assigned_users != ''`
    );
    for (const r of rows || []) {
      let arr;
      try {
        arr = JSON.parse(r.assigned_users);
      } catch {
        continue;
      }
      const next = toOldFormat(arr);
      if (!next || next.length === 0) continue;
      const newVal = JSON.stringify(next);
      await queryInterface.sequelize.query(
        `UPDATE template_masters SET assigned_users = :val WHERE _id = :id`,
        { replacements: { val: newVal, id: r._id } }
      );
    }
  },
};
