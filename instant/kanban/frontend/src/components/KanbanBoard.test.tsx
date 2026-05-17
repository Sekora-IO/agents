import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { KanbanBoard } from "./KanbanBoard";

describe("KanbanBoard", () => {
  it("renders one populated board with five columns", () => {
    render(<KanbanBoard />);

    expect(screen.getByRole("heading", { name: "Kanban Project Manager" })).toBeInTheDocument();
    expect(screen.getAllByTestId(/^column-/)).toHaveLength(5);
    expect(screen.getByText("Confirm project brief")).toBeInTheDocument();
    expect(screen.getByText("Create app shell")).toBeInTheDocument();
  });

  it("renames a column", async () => {
    const user = userEvent.setup();
    render(<KanbanBoard />);

    const renameInput = screen.getByLabelText("Rename Ready column");
    await user.clear(renameInput);
    await user.type(renameInput, "Next Up");

    expect(screen.getByLabelText("Rename Next Up column")).toHaveValue("Next Up");
  });

  it("adds and deletes a card", async () => {
    const user = userEvent.setup();
    render(<KanbanBoard />);

    const backlog = screen.getByTestId("column-backlog");
    await user.click(within(backlog).getByRole("button", { name: "Add card" }));
    await user.type(within(backlog).getByLabelText("Title"), "Prepare demo");
    await user.type(within(backlog).getByLabelText("Details"), "Walk through the final board.");
    await user.click(within(backlog).getByRole("button", { name: "Add" }));

    expect(screen.getByText("Prepare demo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Prepare demo" }));

    expect(screen.queryByText("Prepare demo")).not.toBeInTheDocument();
  });
});
