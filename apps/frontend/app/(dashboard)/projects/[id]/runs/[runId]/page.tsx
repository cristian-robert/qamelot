import { redirect } from 'next/navigation';

export default async function TestRunPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id, runId } = await params;
  redirect(`/projects/${id}/runs/${runId}/execute`);
}
