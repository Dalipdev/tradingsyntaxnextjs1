export default function SimilarBlogsSkeleton() {
  return (
    <>
      <hr className="blog-section-rule" />
      <section className="blog-similar" aria-hidden="true">
        <h2 className="blog-similar-heading">Continue Reading</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: '1px solid var(--ts-rule, rgba(0,0,0,0.08))',
              }}
            >
              <div
                style={{
                  width: '96px',
                  height: '64px',
                  flexShrink: 0,
                  borderRadius: '6px',
                  background: 'var(--ts-rule, rgba(0,0,0,0.06))',
                }}
                className="animate-pulse"
              />
              <div style={{ flex: 1 }}>
                <div
                  className="animate-pulse"
                  style={{
                    height: '14px',
                    width: '80%',
                    borderRadius: '4px',
                    background: 'var(--ts-rule, rgba(0,0,0,0.08))',
                    marginBottom: '8px',
                  }}
                />
                <div
                  className="animate-pulse"
                  style={{
                    height: '11px',
                    width: '40%',
                    borderRadius: '4px',
                    background: 'var(--ts-rule, rgba(0,0,0,0.06))',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}