import manifest from "../../prisma/seed-data.json";
export const bundledStackIcons = [
  ...manifest.stacks.map(({ name, svgPath }) => ({ name, svgPath })),
  { name: "MySQL", svgPath: "/stacks/mysql.svg" },
  { name: "Flutter", svgPath: "/stacks/flutter.svg" },
];
