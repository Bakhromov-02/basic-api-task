export const CalculateTotalPages = (count: number, limit: number) => {
  const totalPages = Math.ceil(count / limit);
  return totalPages;
};
