export { removeEndSlash }

function removeEndSlash(str: string) {
  // Removing trailing forward slashes in the end of a path

  if (str.length > 1 && str.endsWith('/')) {
    return str.slice(0, -1);
  }

  return str;
}