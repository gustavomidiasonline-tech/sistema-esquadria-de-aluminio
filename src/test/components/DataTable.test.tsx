import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DataTable, type ColumnDef } from "@/components/tables";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

interface TestItem {
  id: string;
  name: string;
  age: number;
  city: string;
}

const columns: ColumnDef<TestItem>[] = [
  { key: "name", header: "Name" },
  { key: "age", header: "Age", align: "right", sortable: true },
  { key: "city", header: "City" },
];

function makeItems(count: number): TestItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Person ${i + 1}`,
    age: 20 + i,
    city: `City ${i + 1}`,
  }));
}

const threeItems = makeItems(3);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable data={threeItems} columns={columns} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();
  });

  it("renders data rows correctly", () => {
    render(<DataTable data={threeItems} columns={columns} />);

    expect(screen.getByText("Person 1")).toBeInTheDocument();
    expect(screen.getByText("Person 2")).toBeInTheDocument();
    expect(screen.getByText("Person 3")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("City 3")).toBeInTheDocument();
  });

  it("displays emptyMessage when data is empty", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        emptyMessage="No items found."
      />
    );

    expect(screen.getByText("No items found.")).toBeInTheDocument();
  });

  it("displays skeleton loading state when isLoading is true", () => {
    const { container } = render(
      <DataTable data={[]} columns={columns} isLoading />
    );

    // Skeleton elements are rendered (Skeleton component uses a div with animate-pulse)
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);

    // Data rows should NOT be present
    expect(screen.queryByText("Person 1")).not.toBeInTheDocument();
  });

  it("paginates: shows only pageSize items per page and prev/next work", () => {
    const items = makeItems(15);
    render(<DataTable data={items} columns={columns} pageSize={5} />);

    // Page 1: should show Person 1..5
    expect(screen.getByText("Person 1")).toBeInTheDocument();
    expect(screen.getByText("Person 5")).toBeInTheDocument();
    expect(screen.queryByText("Person 6")).not.toBeInTheDocument();

    // Page indicator
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    // Click next
    const nextButton = screen.getAllByRole("button").find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && btn.querySelector('[class*="chevron-right"]') !== null;
    });
    // Use aria or text approach -- the next button is the second icon button
    const buttons = screen.getAllByRole("button");
    const nextBtn = buttons[buttons.length - 1]; // last button is next
    fireEvent.click(nextBtn);

    // Page 2: should show Person 6..10
    expect(screen.getByText("Person 6")).toBeInTheDocument();
    expect(screen.getByText("Person 10")).toBeInTheDocument();
    expect(screen.queryByText("Person 5")).not.toBeInTheDocument();

    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    // Click prev (second-to-last button)
    const prevBtn = buttons[buttons.length - 2];
    fireEvent.click(prevBtn);

    // Back to page 1
    expect(screen.getByText("Person 1")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("searchValue filters rows by searchable fields", () => {
    const items: TestItem[] = [
      { id: "1", name: "Alice", age: 30, city: "Boston" },
      { id: "2", name: "Bob", age: 25, city: "Chicago" },
      { id: "3", name: "Charlie", age: 35, city: "Boston" },
    ];

    const { rerender } = render(
      <DataTable
        data={items}
        columns={columns}
        searchable={["name", "city"]}
        searchValue="Bob"
      />
    );

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();

    // Search by city
    rerender(
      <DataTable
        data={items}
        columns={columns}
        searchable={["name", "city"]}
        searchValue="Boston"
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("rowClassName is applied to the correct <tr>", () => {
    const items: TestItem[] = [
      { id: "1", name: "Young", age: 18, city: "A" },
      { id: "2", name: "Old", age: 65, city: "B" },
    ];

    render(
      <DataTable
        data={items}
        columns={columns}
        rowClassName={(row) => (row.age >= 60 ? "highlight-row" : undefined)}
      />
    );

    const rows = screen.getAllByRole("row");
    // rows[0] is the header row, rows[1] and rows[2] are data rows
    expect(rows[1].className).not.toContain("highlight-row");
    expect(rows[2].className).toContain("highlight-row");
  });

  it("onRowClick is called when a row is clicked", () => {
    const handleClick = vi.fn();

    render(
      <DataTable
        data={threeItems}
        columns={columns}
        onRowClick={handleClick}
      />
    );

    const rows = screen.getAllByRole("row");
    // Click on the second data row (Person 2)
    fireEvent.click(rows[2]);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(threeItems[1]);
  });

  it("sortable: click header sorts ASC, second click DESC, third removes sort", () => {
    const items: TestItem[] = [
      { id: "1", name: "Charlie", age: 35, city: "X" },
      { id: "2", name: "Alice", age: 20, city: "Y" },
      { id: "3", name: "Bob", age: 28, city: "Z" },
    ];

    render(<DataTable data={items} columns={columns} />);

    // Initial order: Charlie, Alice, Bob (as provided)
    let rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("35")).toBeInTheDocument();
    expect(within(rows[2]).getByText("20")).toBeInTheDocument();
    expect(within(rows[3]).getByText("28")).toBeInTheDocument();

    // Click Age header to sort ASC
    const ageHeader = screen.getByText("Age");
    fireEvent.click(ageHeader);

    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("20")).toBeInTheDocument(); // Alice
    expect(within(rows[2]).getByText("28")).toBeInTheDocument(); // Bob
    expect(within(rows[3]).getByText("35")).toBeInTheDocument(); // Charlie

    // Click again for DESC
    fireEvent.click(ageHeader);

    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("35")).toBeInTheDocument(); // Charlie
    expect(within(rows[2]).getByText("28")).toBeInTheDocument(); // Bob
    expect(within(rows[3]).getByText("20")).toBeInTheDocument(); // Alice

    // Third click removes sort (back to original order)
    fireEvent.click(ageHeader);

    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("35")).toBeInTheDocument(); // Charlie (original)
    expect(within(rows[2]).getByText("20")).toBeInTheDocument(); // Alice (original)
    expect(within(rows[3]).getByText("28")).toBeInTheDocument(); // Bob (original)
  });

  it("footerContent is rendered in the footer", () => {
    render(
      <DataTable
        data={threeItems}
        columns={columns}
        footerContent={<span data-testid="footer">3 items total</span>}
      />
    );

    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByText("3 items total")).toBeInTheDocument();
  });

  it("renderActions renders action buttons and stopPropagation prevents onRowClick", () => {
    const handleRowClick = vi.fn();
    const handleAction = vi.fn();

    render(
      <DataTable
        data={threeItems}
        columns={columns}
        onRowClick={handleRowClick}
        renderActions={(row) => (
          <button data-testid={`action-${row.id}`} onClick={handleAction}>
            Edit
          </button>
        )}
      />
    );

    // Actions column should be rendered
    const actionBtn = screen.getByTestId("action-item-1");
    expect(actionBtn).toBeInTheDocument();

    // Click the action button -- the DataTable wraps renderActions td with stopPropagation
    fireEvent.click(actionBtn);

    // The action handler is called
    expect(handleAction).toHaveBeenCalledTimes(1);

    // onRowClick should NOT be called because the actions <td> has stopPropagation
    expect(handleRowClick).not.toHaveBeenCalled();
  });
});
