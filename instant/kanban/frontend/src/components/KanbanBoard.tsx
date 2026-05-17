"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import {
  Card,
  Column,
  addCard,
  deleteCard,
  initialColumns,
  moveCard,
  renameColumn,
} from "@/lib/board";
import styles from "./KanbanBoard.module.css";

type CardForm = {
  title: string;
  details: string;
};

const emptyCardForm: CardForm = { title: "", details: "" };

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [openFormColumnId, setOpenFormColumnId] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState<CardForm>(emptyCardForm);
  const nextCardId = useRef(1);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const activeCard = activeCardId ? findCard(columns, activeCardId) : null;
  const cardCount = columns.reduce((total, column) => total + column.cards.length, 0);

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const targetColumnId = event.over?.id ? String(event.over.id) : "";
    if (targetColumnId) {
      setColumns((currentColumns) =>
        moveCard(currentColumns, String(event.active.id), targetColumnId),
      );
    }
    setActiveCardId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>, columnId: string) {
    event.preventDefault();
    const title = cardForm.title.trim();
    const details = cardForm.details.trim();

    if (!title || !details) {
      return;
    }

    setColumns((currentColumns) =>
      addCard(currentColumns, columnId, {
        id: `card-new-${nextCardId.current++}`,
        title,
        details,
      }),
    );
    setCardForm(emptyCardForm);
    setOpenFormColumnId(null);
  }

  function closeForm() {
    setOpenFormColumnId(null);
    setCardForm(emptyCardForm);
  }

  return (
    <main className={styles.shell}>
      <section className={styles.header} aria-labelledby="board-title">
        <div>
          <p className={styles.kicker}>Project board</p>
          <h1 id="board-title">Kanban Project Manager</h1>
          <p className={styles.summary}>
            One focused board with five editable columns and {cardCount} active cards.
          </p>
        </div>
        <div className={styles.metrics} aria-label="Board summary">
          <span>{columns.length} columns</span>
          <strong>{cardCount} cards</strong>
        </div>
      </section>

      <DndContext
        id="kanban-board-dnd"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragCancel={() => setActiveCardId(null)}
        onDragEnd={handleDragEnd}
      >
        <section className={styles.board} aria-label="Kanban board">
          {columns.map((column, index) => (
            <KanbanColumn
              key={column.id}
              column={column}
              index={index}
              isFormOpen={openFormColumnId === column.id}
              cardForm={cardForm}
              onRename={(title) =>
                setColumns((currentColumns) =>
                  renameColumn(currentColumns, column.id, title),
                )
              }
              onOpenForm={() => {
                setOpenFormColumnId(column.id);
                setCardForm(emptyCardForm);
              }}
              onCloseForm={closeForm}
              onChangeForm={setCardForm}
              onSubmit={(event) => handleSubmit(event, column.id)}
              onDeleteCard={(cardId) =>
                setColumns((currentColumns) => deleteCard(currentColumns, cardId))
              }
            />
          ))}
        </section>

        <DragOverlay>
          {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

function KanbanColumn({
  column,
  index,
  isFormOpen,
  cardForm,
  onRename,
  onOpenForm,
  onCloseForm,
  onChangeForm,
  onSubmit,
  onDeleteCard,
}: {
  column: Column;
  index: number;
  isFormOpen: boolean;
  cardForm: CardForm;
  onRename: (title: string) => void;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onChangeForm: (form: CardForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteCard: (cardId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <article
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ""}`}
      data-testid={`column-${column.id}`}
      data-column-id={column.id}
      aria-label={`${column.title} column`}
    >
      <div className={styles.columnTop}>
        <span className={styles.columnNumber}>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.cardTotal}>{column.cards.length}</span>
      </div>

      <label className={styles.columnLabel} htmlFor={`column-name-${column.id}`}>
        Column name
      </label>
      <input
        id={`column-name-${column.id}`}
        className={styles.columnName}
        value={column.title}
        onChange={(event) => onRename(event.target.value)}
        aria-label={`Rename ${column.title || "column"} column`}
      />

      <div className={styles.cardList}>
        {column.cards.map((card) => (
          <KanbanCard key={card.id} card={card} onDelete={() => onDeleteCard(card.id)} />
        ))}
      </div>

      {isFormOpen ? (
        <form className={styles.cardForm} onSubmit={onSubmit} aria-label={`Add card to ${column.title}`}>
          <div>
            <label htmlFor={`card-title-${column.id}`}>Title</label>
            <input
              id={`card-title-${column.id}`}
              value={cardForm.title}
              onChange={(event) =>
                onChangeForm({ ...cardForm, title: event.target.value })
              }
              placeholder="Card title"
              required
            />
          </div>
          <div>
            <label htmlFor={`card-details-${column.id}`}>Details</label>
            <textarea
              id={`card-details-${column.id}`}
              value={cardForm.details}
              onChange={(event) =>
                onChangeForm({ ...cardForm, details: event.target.value })
              }
              placeholder="Short details"
              rows={3}
              required
            />
          </div>
          <div className={styles.formActions}>
            <button className={styles.submitButton} type="submit">
              <Plus size={16} aria-hidden="true" />
              Add
            </button>
            <button className={styles.iconButton} type="button" onClick={onCloseForm} aria-label="Close card form">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </form>
      ) : (
        <button className={styles.addButton} type="button" onClick={onOpenForm}>
          <Plus size={16} aria-hidden="true" />
          Add card
        </button>
      )}
    </article>
  );
}

function KanbanCard({
  card,
  onDelete,
  isOverlay = false,
}: {
  card: Card;
  onDelete?: () => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isDragging ? styles.cardDragging : ""} ${
        isOverlay ? styles.cardOverlay : ""
      }`}
      data-testid={`card-${card.id}`}
    >
      <div className={styles.cardHeader}>
        <button
          className={styles.dragHandle}
          type="button"
          aria-label={`Drag ${card.title}`}
          title="Drag card"
          {...listeners}
          {...attributes}
        >
          <GripVertical size={17} aria-hidden="true" />
        </button>
        <h2>{card.title}</h2>
        {onDelete ? (
          <button
            className={styles.deleteButton}
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${card.title}`}
            title="Delete card"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <p>{card.details}</p>
    </article>
  );
}

function findCard(columns: Column[], cardId: string) {
  for (const column of columns) {
    const card = column.cards.find((item) => item.id === cardId);
    if (card) {
      return card;
    }
  }

  return null;
}
