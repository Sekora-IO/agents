import { expect, test } from "@playwright/test";

test("supports the MVP board workflow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Kanban Project Manager" })).toBeVisible();
  await expect(page.getByTestId(/^column-/)).toHaveCount(5);
  await expect(page.getByText("Confirm project brief")).toBeVisible();

  const readyRename = page.getByLabel("Rename Ready column");
  await readyRename.fill("Next Up");
  await expect(page.getByLabel("Rename Next Up column")).toHaveValue("Next Up");

  const backlog = page.getByTestId("column-backlog");
  await backlog.getByRole("button", { name: "Add card" }).click();
  await backlog.getByLabel("Title").fill("Prep launch demo");
  await backlog.getByLabel("Details").fill("Show the board workflow from a clean state.");
  await backlog.getByRole("button", { name: "Add" }).click();
  await expect(backlog.getByText("Prep launch demo")).toBeVisible();

  await page.getByRole("button", { name: "Delete Prep launch demo" }).click();
  await expect(page.getByText("Prep launch demo")).toHaveCount(0);

  const dragHandle = page.getByRole("button", { name: "Drag Refine board layout" });
  const targetColumn = page.getByTestId("column-review");
  const handleBox = await dragHandle.boundingBox();
  const targetBox = await targetColumn.boundingBox();

  expect(handleBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, {
    steps: 12,
  });
  await page.mouse.up();

  await expect(targetColumn.getByText("Refine board layout")).toBeVisible();
});
