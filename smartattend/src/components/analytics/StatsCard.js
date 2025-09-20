// src/components/analytics/StatsCard.js
export default function StatsCard({ title, value }) {
  const cardStyles = {
    backgroundColor: '#f9f9f9',
    border: '1px solid #eaeaea',
    borderRadius: '8px',
    padding: '1.5rem',
    textAlign: 'center',
  };

  const titleStyles = {
    margin: '0 0 0.5rem 0',
    fontSize: '1rem',
    color: '#666',
  };

  const valueStyles = {
    margin: '0',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#333',
  };

  return (
    <div style={cardStyles}>
      <h3 style={titleStyles}>{title}</h3>
      <p style={valueStyles}>{value}</p>
    </div>
  );
}
