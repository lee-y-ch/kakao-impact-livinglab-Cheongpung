import { ActivityCard, type ActivityCardData } from "./ActivityCard";

type Props = {
  cards: ActivityCardData[];
  empty?: React.ReactNode;
  interactive?: boolean;
};

export function ActivityGrid({ cards, empty, interactive = true }: Props) {
  if (cards.length === 0) {
    return <>{empty}</>;
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <li key={card.id}>
          <ActivityCard card={card} interactive={interactive} />
        </li>
      ))}
    </ul>
  );
}
