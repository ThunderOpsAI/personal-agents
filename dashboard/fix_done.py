import re

with open('app.js', 'r') as f:
    content = f.read()

bad_block = """        if (doneBtn) {
            doneBtn.addEventListener('click', async () => {
                const title = card.querySelector('.protocol-info p')?.innerText || id;
                card.classList.add('completed');
                doneBtn.innerText = "Done";
                doneBtn.disabled = true;
                if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                if (id) {
                    fetch(API_AGENDA, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'update_status', status: 'dismissed' })
                    }).then(() => { loadAgenda(); }).catch(() => {});
                } else {
                    card.remove();
                }
            });
        }
        
        if (reinstateBtn) {
            reinstateBtn.addEventListener('click', () => {
                if (id) {
                    fetch(API_AGENDA, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'update_status', status: 'pending' })
                    }).then(() => { loadAgenda(); }).catch(() => {});
                }
            });
        } catch (err) {
            showToast('Failed to complete agenda item');
            console.error(err);
        }
    }"""

good_block = """        if (doneBtn) {
            doneBtn.addEventListener('click', async () => {
                try {
                    const title = card.querySelector('.protocol-info p')?.innerText || id;
                    card.classList.add('completed');
                    doneBtn.innerText = "Done";
                    doneBtn.disabled = true;
                    if (id) {
                        await fetch(API_AGENDA, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, action: 'update_status', status: 'completed' })
                        });
                        loadAgenda();
                    }
                } catch (err) {
                    showToast('Failed to complete agenda item');
                    console.error(err);
                }
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                if (id) {
                    fetch(API_AGENDA, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'update_status', status: 'dismissed' })
                    }).then(() => { loadAgenda(); }).catch(() => {});
                } else {
                    card.remove();
                }
            });
        }
        
        if (reinstateBtn) {
            reinstateBtn.addEventListener('click', () => {
                if (id) {
                    fetch(API_AGENDA, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'update_status', status: 'pending' })
                    }).then(() => { loadAgenda(); }).catch(() => {});
                }
            });
        }
    }"""

if bad_block in content:
    content = content.replace(bad_block, good_block)
    with open('app.js', 'w') as f:
        f.write(content)
    print("Fixed!")
else:
    print("Could not find the bad block. Check string.")

