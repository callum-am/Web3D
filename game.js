$(function() {
    const canvas = $('#gameCanvas')[0];
    const ctx = canvas.getContext('2d');
    const groundY = 200;
    const canRadius = 15;
    const canStart = { x: 50, y: groundY - canRadius };
    const dragBox = { x: canStart.x - 30, y: canStart.y - 30, w: 60, h: 60 };
    const binBaseX = 400, binY = groundY - 30, binW = 40, binH = 40;
    let binX = binBaseX;
    let can = { x: canStart.x, y: canStart.y, vx: 0, vy: 0, flying: false };
    let msg = '';
    let dragging = false;
    let dragStart = null;
    let dragCurrent = null;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      
        ctx.fillStyle = '#888';
        ctx.fillRect(0, groundY, canvas.width, 10);
   
        ctx.fillStyle = '#444';
        ctx.fillRect(binX, binY, binW, binH);
        
        ctx.save();
        ctx.strokeStyle = dragging ? '#0d6efd' : '#333';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(dragBox.x, dragBox.y, dragBox.w, dragBox.h);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(can.x, can.y, canRadius, 0, 2 * Math.PI);
        ctx.fillStyle = dragging ? '#fa5252' : '#f00';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        if (dragging && dragCurrent) {
            ctx.save();
            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = '#0d6efd';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(canStart.x, canStart.y);
            ctx.lineTo(dragCurrent.x, dragCurrent.y);
            ctx.stroke();
            ctx.restore();
        }

        if (msg) {
            ctx.save();
            ctx.font = "20px Arial";
            ctx.fillStyle = "#222";
            ctx.textAlign = "center";
            ctx.fillText(msg, canvas.width / 2, groundY + 40);
            ctx.restore();
        }
    }

    function resetCan() {
        can.x = canStart.x;
        can.y = canStart.y;
        can.vx = 0;
        can.vy = 0;
        can.flying = false;
        msg = '';
        dragging = false;
        dragStart = null;
        dragCurrent = null;
        //move bin a little on reset
        binX = binBaseX + (Math.random() * 16);
        $('#gameMsg').text('');
        draw();
    }

    function update() {
        if (can.flying) {
            can.x += can.vx;
            can.y += can.vy;
            can.vy += 0.5; // gravity
            //ground collision
            if (can.y + canRadius >= groundY) {
                can.y = groundY - canRadius;
                can.flying = false;
                //check if in bin
                if (
                    can.x + canRadius > binX &&
                    can.x - canRadius < binX + binW &&
                    can.y + canRadius > binY &&
                    can.y < binY + binH
                ) {
                    msg = 'Nice shot!';
                } else {
                    msg = 'Missed! Try again.';
                }
                $('#gameMsg').text('');
                setTimeout(resetCan, 1200);
            }
            draw();
            if (can.flying) requestAnimationFrame(update);
        }
    }

    function isInDragBox(mx, my) {
        return (
            mx >= dragBox.x &&
            mx <= dragBox.x + dragBox.w &&
            my >= dragBox.y &&
            my <= dragBox.y + dragBox.h
        );
    }
    function isOnCan(mx, my) {
        const dx = mx - canStart.x;
        const dy = my - canStart.y;
        return Math.sqrt(dx * dx + dy * dy) <= canRadius;
    }

    $(canvas).on('mousedown', function(e) {
        if (can.flying) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (isInDragBox(mx, my) && isOnCan(mx, my)) {
            dragging = true;
            dragStart = { x: mx, y: my };
            dragCurrent = { x: mx, y: my };
        }
    });

    $(canvas).on('mousemove', function(e) {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        // keep mousedrag within box
        dragCurrent = {
            x: Math.max(dragBox.x, Math.min(mx, dragBox.x + dragBox.w)),
            y: Math.max(dragBox.y, Math.min(my, dragBox.y + dragBox.h))
        };
        draw();
    });

    $(canvas).on('mouseup mouseleave', function(e) {
        if (!dragging) return;
        dragging = false;
        // force calculation
        const dx = canStart.x - dragCurrent.x;
        const dy = canStart.y - dragCurrent.y;
        // force scaling
        can.vx = dx * 0.31;
        can.vy = dy * 0.31;
        can.flying = true;
        dragCurrent = null;
        $('#gameMsg').text('');
        update();
    });

    resetCan();
});
