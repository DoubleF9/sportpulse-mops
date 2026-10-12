"""Genereaza Use Case Diagram pentru SportPulse (docs/diagrams/use_case_diagram.png).

Rulare: python tools/use_case_diagram.py
Sursa echivalenta PlantUML: docs/diagrams/use_case_diagram.puml
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, FancyBboxPatch

OUT = Path(__file__).resolve().parent.parent / "docs" / "diagrams" / "use_case_diagram.png"

UC_W, UC_H = 3.9, 0.82
LEFT_X, RIGHT_X = 6.4, 11.3

# Cazuri de utilizare: id -> (text, x, y)
left_texts = [
    ("UC1", "Selectare sport"),
    ("UC2", "Vizualizare program meciuri\n(pe zile)"),
    ("UC3", "Urmărire scoruri live"),
    ("UC4", "Filtrare după țară / competiție"),
    ("UC5", "Vizualizare detalii meci"),
    ("UC6", "Comparare head-to-head"),
    ("UC7", "Vizualizare clasament"),
    ("UC8", "Vizualizare echipă și lot"),
    ("UC9", "Vizualizare profil jucător"),
    ("UC10", "Căutare echipe / jucători /\ncompetiții"),
    ("UC11", "Export meci în calendar (.ics)"),
    ("UC12", "Înregistrare cont"),
]
right_texts = [
    ("UC13", "Autentificare", 16.3),
    ("UC14", "Gestionare favorite", 15.0),
    ("UC15", "Vizualizare „Meciurile mele”", 13.7),
    ("UC16", "Vizualizare meciuri recomandate\n(Interest Score)", 12.4),
    ("UC17", "Primire notificări\n(start, gol, final)", 11.1),
    ("UC18", "Configurare sporturi /\ncompetiții afișate", 6.6),
    ("UC19", "Monitorizare consum API", 5.3),
]

ucs = {}
for i, (uid, txt) in enumerate(left_texts):
    ucs[uid] = (txt, LEFT_X, 16.3 - i * 1.15)
for uid, txt, y in right_texts:
    ucs[uid] = (txt, RIGHT_X, y)
ucs["UC20"] = ("Sincronizare date sportive\n(cache)", 8.85, 1.25)

actors = {
    "Vizitator": (1.2, 10.0),
    "Utilizator\nînregistrat": (16.6, 13.2),
    "Administrator": (16.6, 5.9),
    "Planificator\n(timer sistem)": (1.2, 1.25),
    "API-Sports\n(sistem extern)": (16.6, 1.25),
}

fig, ax = plt.subplots(figsize=(15, 14))
ax.set_xlim(-0.5, 18.5)
ax.set_ylim(-0.3, 18.6)
ax.set_aspect("equal")
ax.axis("off")

# System boundary
ax.add_patch(FancyBboxPatch((3.9, 0.3), 9.9, 17.0, boxstyle="round,pad=0.05",
                            fill=False, lw=1.6, ec="#1F3A5F"))
ax.text(8.85, 17.0, "Sistem: SportPulse", ha="center", va="center",
        fontsize=13, fontweight="bold", color="#1F3A5F")


def edge_point(uid, toward_x, toward_y):
    """Punct pe marginea elipsei in directia (toward_x, toward_y)."""
    _, x, y = ucs[uid]
    import math
    dx, dy = toward_x - x, toward_y - y
    a, b = UC_W / 2, UC_H / 2
    t = 1 / math.sqrt((dx / a) ** 2 + (dy / b) ** 2)
    return x + dx * t, y + dy * t


def draw_actor(name, x, y):
    c = "#222222"
    ax.add_patch(plt.Circle((x, y + 0.75), 0.22, fill=False, lw=1.5, ec=c))
    ax.plot([x, x], [y + 0.53, y - 0.1], c=c, lw=1.5)
    ax.plot([x - 0.4, x + 0.4], [y + 0.3, y + 0.3], c=c, lw=1.5)
    ax.plot([x, x - 0.3], [y - 0.1, y - 0.55], c=c, lw=1.5)
    ax.plot([x, x + 0.3], [y - 0.1, y - 0.55], c=c, lw=1.5)
    ax.text(x, y - 0.75, name, ha="center", va="top", fontsize=10, fontweight="bold")


def assoc(actor, uid):
    ax_, ay = actors[actor]
    _, x, y = ucs[uid]
    if abs(ax_ - x) > 3:
        px, py = (x - UC_W / 2, y) if ax_ < x else (x + UC_W / 2, y)
    else:
        px, py = edge_point(uid, ax_, ay)
    sx = ax_ + (0.45 if px > ax_ else -0.45)
    ax.plot([sx, px], [ay + 0.15, py], c="#555555", lw=0.9, zorder=1)


def dashed(src, dst, label):
    _, dx_, dy_ = ucs[dst]
    _, sx_, sy_ = ucs[src]
    x1, y1 = edge_point(src, dx_, dy_)
    x2, y2 = edge_point(dst, sx_, sy_)
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", ls="--", color="#8A3B12", lw=1.1))
    ax.text((x1 + x2) / 2 + 0.12, (y1 + y2) / 2, label, fontsize=8.5,
            color="#8A3B12", style="italic", ha="left", va="center")


for uid, (txt, x, y) in ucs.items():
    ax.add_patch(Ellipse((x, y), UC_W, UC_H, fc="#EAF2FB", ec="#1F3A5F", lw=1.2, zorder=2))
    ax.text(x, y, txt, ha="center", va="center", fontsize=9, zorder=3)
    ax.text(x - UC_W / 2 + 0.05, y + UC_H / 2 - 0.02, uid, fontsize=7, color="#1F3A5F")

for name, (x, y) in actors.items():
    draw_actor(name, x, y)

for i in range(1, 13):
    assoc("Vizitator", f"UC{i}")
for uid in ("UC13", "UC14", "UC15", "UC16", "UC17"):
    assoc("Utilizator\nînregistrat", uid)
for uid in ("UC18", "UC19"):
    assoc("Administrator", uid)
assoc("Planificator\n(timer sistem)", "UC20")
assoc("API-Sports\n(sistem extern)", "UC20")

# Generalizare: Utilizator inregistrat -> Vizitator (traseu pe deasupra granitei sistemului)
ux, uy = actors["Utilizator\nînregistrat"]
vx, vy = actors["Vizitator"]
ax.plot([ux, ux, vx], [uy + 1.0, 17.9, 17.9], c="#222222", lw=1.1)
ax.annotate("", xy=(vx, vy + 1.0), xytext=(vx, 17.9),
            arrowprops=dict(arrowstyle="-|>", color="#222222", lw=1.1,
                            mutation_scale=18, fc="white"))
ax.text(8.85, 18.1, "generalizare (Utilizatorul înregistrat poate face tot ce face Vizitatorul)",
        ha="center", fontsize=8.5, color="#222222")
# Generalizare: Administrator -> Utilizator inregistrat
ax.annotate("", xy=(ux, uy - 1.35), xytext=(ux, actors["Administrator"][1] + 1.0),
            arrowprops=dict(arrowstyle="-|>", color="#222222", lw=1.1,
                            mutation_scale=18, fc="white"))

dashed("UC14", "UC13", "«include»")
dashed("UC15", "UC14", "«include»")
dashed("UC6", "UC5", "«extend»")

OUT.parent.mkdir(parents=True, exist_ok=True)
fig.savefig(OUT, dpi=160, bbox_inches="tight", facecolor="white")
print(f"Salvat: {OUT}")
