import Link from 'next/link';

export default function Index() {
  return (
    <div>
      <h1>Home</h1>
      <Link href="/reports/32">You probably want to see a report.</Link>
    </div>
  );
}
