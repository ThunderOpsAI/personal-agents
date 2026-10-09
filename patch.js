const fs = require('fs');
let content = fs.readFileSync('dashboard/public/index.html', 'utf8');

const target = `<div class="runner-visual" style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden; margin: 15px 0; display: flex; align-items: center; justify-content: center;">
                    <img id="runnerImg" alt="Exercise Demo" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; display: none; transition: opacity 0.4s ease;">
                    <video id="runnerVideo" playsinline autoplay muted loop style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; display: none;"></video>
                    <div class="visual-placeholder" id="runnerPlaceholder" style="z-index: 1;">START</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="flex: 1; min-width: 0; padding-right: 8px;">
                        <h3 id="runnerStep" style="margin-bottom: 2px;">Step 1: Alignment & Position</h3>
                        <p id="runnerCue" style="margin: 3px 0 8px 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.35;"></p>
                        
                        <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 8px; padding: 10px 14px; margin-top: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                <div>
                                    <span style="font-size: 0.72rem; color: var(--neon-blue); text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Program Countdown</span>
                                    <div class="timer" id="runnerTimer" style="cursor: pointer; margin: 2px 0 0 0; font-size: 2.3rem; font-weight: 800; color: var(--neon-purple); line-height: 1;" title="Click to Pause/Resume">15:00</div>
                                </div>
                                <div style="text-align: right;">
                                    <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Current Step Hold</span>
                                    <div id="runnerStepTimer" style="font-size: 1.3rem; font-weight: 700; color: var(--neon-blue); font-family: var(--font-heading); margin-top: 2px;">03:45</div>
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 8px; margin-bottom: 3px;">
                                <span>Total Routine Progress</span>
                                <span id="runnerTotalProgressPct" style="color: var(--neon-blue); font-weight: 600;">0%</span>
                            </div>
                            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                                <div id="runnerTotalProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--neon-blue), var(--neon-purple)); transition: width 0.3s ease;"></div>
                            </div>

                            <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-muted); margin-top: 6px; margin-bottom: 2px;">
                                <span>Step Hold Progress</span>
                                <span id="runnerStepProgressPct" style="color: var(--text-secondary);">0%</span>
                            </div>
                            <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden;">
                                <div id="runnerStepProgressBar" style="width: 0%; height: 100%; background: var(--neon-blue); transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    </div>
                </div>`;

const replacement = `<div class="runner-visual" style="position: relative; width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 12px; overflow: hidden; margin: 15px 0; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <img id="runnerImg" alt="Exercise Demo" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; display: none; transition: opacity 0.4s ease;">
                    <video id="runnerVideo" playsinline autoplay muted loop style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; display: none;"></video>
                    <div class="visual-placeholder" id="runnerPlaceholder" style="z-index: 1;">START</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 8px; gap: 15px;">
                    <div style="flex: 1; min-width: 0;">
                        <h3 id="runnerStep" style="margin-bottom: 2px;">Step 1: Alignment & Position</h3>
                        <p id="runnerCue" style="margin: 3px 0 8px 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.35;"></p>
                        
                        <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 8px; padding: 10px 14px; margin-top: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                <div>
                                    <span style="font-size: 0.72rem; color: var(--neon-blue); text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Program Countdown</span>
                                    <div class="timer" id="runnerTimer" style="cursor: pointer; margin: 2px 0 0 0; font-size: 1.2rem; font-weight: 800; color: var(--neon-purple); line-height: 1;" title="Click to Pause/Resume">15:00</div>
                                </div>
                                <div style="text-align: right;">
                                    <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Current Step Hold</span>
                                    <div id="runnerStepTimer" style="font-size: 1.2rem; font-weight: 700; color: var(--neon-blue); font-family: var(--font-heading); margin-top: 2px;">03:45</div>
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-muted); margin-top: 8px; margin-bottom: 2px;">
                                <span>Step Hold Progress</span>
                                <span id="runnerStepProgressPct" style="color: var(--text-secondary);">0%</span>
                            </div>
                            <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden;">
                                <div id="runnerStepProgressBar" style="width: 0%; height: 100%; background: var(--neon-blue); transition: width 0.3s ease;"></div>
                            </div>
                            <span id="runnerTotalProgressPct" style="display: none;">0%</span>
                        </div>
                    </div>
                    <div style="width: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; position: relative;">
                        <div id="runnerTotalProgressBar" style="width: 100%; height: 0%; background: linear-gradient(0deg, var(--neon-blue), var(--neon-purple)); transition: height 0.3s ease;"></div>
                    </div>
                </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('dashboard/public/index.html', content);
