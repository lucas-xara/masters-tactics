import React, { useEffect } from 'react';

function Unit() {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = '../../../scripts/script.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div>
            <h1>Fire Emblem Heroes</h1>
            <label htmlFor="hero-select">Select a Hero:</label>
            <select id="hero-select">
                <option value="">--None--</option>
            </select>
            <div id="hero-info" className="hero-info"></div>
        </div>
    );
}

export default Unit;
