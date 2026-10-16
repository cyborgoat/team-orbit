export function paginate(page = 1, limit = 20) {
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;
  return { skip, take, page: Math.max(page, 1), limit: take };
}
