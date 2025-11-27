export default function capitalize(str: string | undefined | null): string {
  if (!str || str.length === 0) return str ?? "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}