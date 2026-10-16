export function tagWrite(tags: string[] = []) {
  return {
    connectOrCreate: [
      ...new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
    ].map((name) => ({ where: { name }, create: { name } })),
  };
}
