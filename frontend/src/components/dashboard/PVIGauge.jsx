const PVIGauge = ({ value }) => {
    // value 0-100
    // Color logic
    let color = 'var(--pvi-green)';
    if (value > 35) color = 'var(--pvi-yellow)';
    if (value > 65) color = 'var(--pvi-red)';

    // Calculate generic rotation for a semi-circle gauge usually requires SVG or canvas
    // Simple CSS implementation:

    return (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--color-text-muted)' }}>Procrastination Velocity Index</h3>

            <div style={{
                position: 'relative',
                width: '200px',
                height: '100px',
                margin: '2rem auto 0',
                overflow: 'hidden'
            }}>
                {/* Gauge Background */}
                <div style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                }}></div>

                {/* Gauge Fill - Simplified as a full block for MVP or better CSS conic gradient */}
                {/* Let's use a cleaner number display with color border instead of complex CSS shapes for reliability */}
            </div>

            <div style={{ transform: 'translateY(-100px)' }}>
                <div style={{
                    fontSize: '4rem',
                    fontWeight: 'bold',
                    color: color,
                    marginBottom: '0.5rem'
                }}>
                    {value}
                </div>
                <div style={{
                    width: '100%',
                    height: '10px',
                    background: '#334155',
                    borderRadius: '5px',
                    maxWidth: '200px',
                    margin: '0 auto',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${value}%`,
                        height: '100%',
                        background: color,
                        transition: 'width 1s ease-out'
                    }}></div>
                </div>
            </div>
        </div>
    );
};

export default PVIGauge;
