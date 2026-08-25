export async function subscribeToNewsletter(email) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/newsletter-subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Could not subscribe. Please try again.");
  }

  return data;
}