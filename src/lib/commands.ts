interface Command {
  name: string;
  shortcuts: string[];
  description: string;
}

const commands: Command[] = [
  { name: "zxonline.showHelp", shortcuts: ["Shift+?"], description: "Show help" },
  { name: "zxonline.selectTool", shortcuts: ["S"], description: "Select tool" },
  { name: "zxonline.nodeTool", shortcuts: ["N"], description: "Node tool" },
  { name: "zxonline.edgeTool", shortcuts: ["E"], description: "Edge tool" },
  { name: "zxonline.delete", shortcuts: ["Delete"], description: "Delete items" },
  { name: "zxonline.zoomOut", shortcuts: ["-", "_"], description: "Zoom out" },
  { name: "zxonline.zoomIn", shortcuts: ["Plus", "="], description: "Zoom in" },
  { name: "zxonline.cut", shortcuts: ["Ctrl+X"], description: "Cut" },
  { name: "zxonline.copy", shortcuts: ["Ctrl+C"], description: "Copy" },
  { name: "zxonline.paste", shortcuts: ["Ctrl+V"], description: "Paste" },
  { name: "zxonline.viewTikzSource", shortcuts: ["Ctrl+Alt+T"], description: "View TikZ source" },
  { name: "zxonline.selectAll", shortcuts: ["Ctrl+A"], description: "Select all" },
  { name: "zxonline.deselectAll", shortcuts: ["Ctrl+D"], description: "Deselect all" },
  {
    name: "zxonline.extendSelectionLeft",
    shortcuts: ["Shift+ArrowLeft"],
    description: "Extend selection left",
  },
  {
    name: "zxonline.extendSelectionRight",
    shortcuts: ["Shift+ArrowRight"],
    description: "Extend selection left",
  },
  {
    name: "zxonline.extendSelectionUp",
    shortcuts: ["Shift+ArrowUp"],
    description: "Extend selection up",
  },
  {
    name: "zxonline.extendSelectionDown",
    shortcuts: ["Shift+ArrowDown"],
    description: "Extend selection down",
  },
  { name: "zxonline.moveLeft", shortcuts: ["Ctrl+ArrowLeft"], description: "Move left" },
  { name: "zxonline.moveRight", shortcuts: ["Ctrl+ArrowRight"], description: "Move right" },
  { name: "zxonline.moveUp", shortcuts: ["Ctrl+ArrowUp"], description: "Move up" },
  { name: "zxonline.moveDown", shortcuts: ["Ctrl+ArrowDown"], description: "Move down" },
  { name: "zxonline.nudgeLeft", shortcuts: ["Ctrl+Shift+ArrowLeft"], description: "Nudge left" },
  { name: "zxonline.nudgeRight", shortcuts: ["Ctrl+Shift+ArrowRight"], description: "Nudge right" },
  { name: "zxonline.nudgeUp", shortcuts: ["Ctrl+Shift+ArrowUp"], description: "Nudge up" },
  { name: "zxonline.nudgeDown", shortcuts: ["Ctrl+Shift+ArrowDown"], description: "Nudge down" },
  { name: "zxonline.joinWires", shortcuts: ["Ctrl+Alt+P"], description: "Join wires" },
  { name: "zxonline.splitWires", shortcuts: ["Ctrl+Alt+Shift+P"], description: "Split wires" },
  { name: "zxonline.mergeNodes", shortcuts: ["Ctrl+M"], description: "Merge nodes" },
];

const getCommandFromShortcut = (shortcut: string): Command | undefined => {
  return commands.find(command => command.shortcuts.includes(shortcut));
};

// const commandForName = (name: string): Command | undefined => {
//   return commands.find(command => command.name === name);
// };

export { Command, commands, getCommandFromShortcut };
