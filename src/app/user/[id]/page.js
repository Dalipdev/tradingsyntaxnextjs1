import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

export async function generateMetadata({ params }) {
  const { id } = params;
  const SERVER = process.env.NEXT_PUBLIC_SERVER_DOMAIN;
  if (!SERVER) return { title: 'User Not Found' };

  const res = await fetchWithTimeout(
    `${SERVER}/get-profile`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: id }),
    },
    { timeout: 8000, fallback: null }
  );

  const data = await res.json();

  if (!data || data.error) return { title: "User Not Found" };

  return {
    title: `${data.personal_info.fullname} (@${data.personal_info.username}) | TradingSyntax`,
    description: data.personal_info.bio || `Check out ${data.personal_info.fullname}'s profile on TradingSyntax.`,
  };
}

export default async function Page({ params }) {
  const { id } = params;
  const SERVER = process.env.NEXT_PUBLIC_SERVER_DOMAIN;
  if (!SERVER) return notFound();

  const res = await fetchWithTimeout(
    `${SERVER}/get-profile`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: id }),
      next: { revalidate: 60 }
    },
    { timeout: 8000, fallback: null }
  );

  const profile = await res.json();

  if (!profile || profile.error) return notFound();

  return <ProfileClient profile={profile} profileId={id} />;
}