// frontend/src/services/daoApi.ts
export async function fetchDao(id: string) {
  const res = await fetch(`http://localhost:4000/api/daos/${id}`);
  if (!res.ok) throw new Error('DAO not found');
  return res.json();
}