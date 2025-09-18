
export default function StatsCard({ title, value }) {
  const cardStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  const titleStyle = {
    fontSize: '1rem',
    color: '#555',
    margin: '0 0 0.5rem 0',
  };

  const valueStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#111',
    margin: 0,
  };

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>{title}</h3>
      <p style={valueStyle}>{value}</p>
    </div>
  );
}
