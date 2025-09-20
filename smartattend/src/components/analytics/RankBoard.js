// src/components/analytics/RankBoard.js
export default function RankBoard({ leaderboard, currentUserRank, currentUserName }) {
  const boardStyles = {
    backgroundColor: '#f9f9f9',
    border: '1px solid #eaeaea',
    borderRadius: '8px',
    padding: '1.5rem',
  };

  const headerStyles = {
    marginBottom: '1rem',
    borderBottom: '1px solid #ddd',
    paddingBottom: '0.5rem',
  };

  const listStyles = {
    listStyle: 'none',
    padding: '0',
    margin: '0',
  };

  const listItemStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0.5rem',
    borderRadius: '4px',
  };

  const currentUserStyle = {
    ...listItemStyles,
    backgroundColor: '#e0f7fa',
    fontWeight: 'bold',
  };

  return (
    <div style={boardStyles}>
      <h2 style={headerStyles}>Leaderboard</h2>
      <ul style={listStyles}>
        {leaderboard && leaderboard.map((player, index) => (
          <li key={player.studentId} style={player.name === currentUserName ? currentUserStyle : listItemStyles}>
            <span>{index + 1}. {player.name}</span>
            <span>{player.attendanceCount} attendances</span>
          </li>
        ))}
      </ul>
      <div style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd'}}>
        <strong>Your Rank: #{currentUserRank} ({currentUserName})</strong>
      </div>
    </div>
  );
}
