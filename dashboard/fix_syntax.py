import re

with open('app.js', 'r') as f:
    content = f.read()

# Fix the duplicate function attachCardEvents
duplicate_func = """    // --- 4. Daily Agenda Cards ---
    function attachCardEvents(card) {
        const showBtn = card.querySelector('.btn-show-me');
        const doneBtn = card.querySelector('.btn-done');

    // --- 4. Daily Agenda Cards ---
    function attachCardEvents(card) {"""
content = content.replace(duplicate_func, """    // --- 4. Daily Agenda Cards ---
    function attachCardEvents(card) {""")

# Fix the extra } at line 577
extra_bracket = """        });
    };
    }

    if (btnReturnToday) {"""
content = content.replace(extra_bracket, """        });
    }

    if (btnReturnToday) {""")

with open('app.js', 'w') as f:
    f.write(content)

