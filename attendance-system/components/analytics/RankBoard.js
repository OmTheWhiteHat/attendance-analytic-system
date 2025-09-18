
export default function RankBoard({ leaderboard, currentUserRank, currentUserName }) {
  const boardStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    marginTop: '2rem',
  };

  const titleStyle = {
    textAlign: 'center',
    margin: '0 0 1.5rem 0',
  };

  const listStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  };

  const itemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderRadius: '5px',
    marginBottom: '0.5rem',
  };

  const rankStyle = { fontWeight: 'bold', marginRight: '1rem' };
  const nameStyle = { flexGrow: 1 };
  const scoreStyle = { fontWeight: 'bold' };

  return (
    <div style={boardStyle}>
      <h2 style={titleStyle}>Leaderboard</h2>
      <p style={{textAlign: 'center', margin: '-1rem 0 1.5rem 0'}}>Your current rank is: <strong>{currentUserRank}</strong></p>
      <ul style={listStyle}>
        {leaderboard.map((player, index) => (
          <li 
            key={player._id} 
            style={{
                ...itemStyle, 
                backgroundColor: player.name === currentUserName ? '#e0f7fa' : '#f9f9f9' 
            }}
          >
            <span style={rankStyle}>{index + 1}</span>
            <span style={nameStyle}>{player.name}</span>
            <span style={scoreStyle}>{player.attendanceCount} attendances</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
