const uuid = () => {
  return Math.random().toString(36).slice(4);
};

export const generateUniqueKey = (key?: string) => {
  if (key) {
    return `${key}-${uuid()}`;
  }
  return uuid();
};

export default uuid;
