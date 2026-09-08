import Phone from "./Phone";

export default async function PhonePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <Phone code={code.toUpperCase()} />;
}
