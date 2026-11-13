"""Render the actual exported OBJ triangles using a simple CPU orthographic painter.

This is a geometry study, not a screenshot of the browser or a PBR quality test.
Run from the project root after generate-model.mjs.
"""
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

root = Path(__file__).resolve().parents[2]
vertices, faces, names = [], [], []
part = ''
for line in (root / 'assets/generated/caliper-reference.obj').read_text().splitlines():
    fields = line.split()
    if not fields:
        continue
    if fields[0] == 'o':
        part = ' '.join(fields[1:])
    elif fields[0] == 'v':
        vertices.append([float(x) for x in fields[1:4]])
    elif fields[0] == 'f':
        ids = [int(x.split('/')[0]) - 1 for x in fields[1:]]
        for index in range(1, len(ids)-1):
            faces.append([ids[0], ids[index], ids[index+1]])
            names.append(part)

vertices = np.asarray(vertices)
faces = np.asarray(faces)
triangles = vertices[faces]
normals = np.cross(triangles[:, 1]-triangles[:, 0], triangles[:, 2]-triangles[:, 0])
normals /= np.maximum(np.linalg.norm(normals, axis=1)[:, None], 1e-12)
centres = triangles.mean(axis=1)
light = np.array([-.4, .7, 1.])
light /= np.linalg.norm(light)

fig, axes = plt.subplots(3, 1, figsize=(16, 10), facecolor='#f7f3e9')
for ax, title, direction in zip(axes, ['FRONT / graduation side', 'REAR / depth routing and step blades', 'THREE-QUARTER / extrusion and clearance'], [[0,0,1],[0,0,-1],[.45,.6,1]]):
    view = np.asarray(direction, dtype=float)
    view /= np.linalg.norm(view)
    right = np.cross([0,1,0], view)
    right /= np.linalg.norm(right)
    up = np.cross(view, right)
    screen = np.stack([vertices@right, vertices@up], axis=1)
    order = np.argsort(centres@view)
    polys, colors = [], []
    for i in order:
        if normals[i]@view < -.00001 and 'graduations' not in names[i]:
            continue
        polys.append(screen[faces[i]])
        if 'graduations' in names[i]:
            colors.append('#263942')
        elif 'contact' in names[i] or 'reference_face' in names[i]:
            shade = .63 + .24*max(0, normals[i]@light)
            colors.append((shade*.87, shade*.99, shade))
        else:
            shade = .52 + .34*max(0, normals[i]@light)
            colors.append((shade*.98, shade, shade))
    ax.add_collection(PolyCollection(polys, facecolors=colors, edgecolors='none', antialiaseds=True))
    lo, hi = screen.min(axis=0), screen.max(axis=0)
    ax.set_xlim(lo[0]-8, hi[0]+8)
    ax.set_ylim(lo[1]-9, hi[1]+12)
    ax.set_aspect('equal')
    ax.set_facecolor('#f7f3e9')
    ax.set_axis_off()
    ax.text(0,.98,title,transform=ax.transAxes,va='top',color='#356b67',fontsize=12,fontweight='bold')

fig.suptitle('PRECISION LAB  /  Original parametric geometry study', x=.09, ha='left', fontsize=21, color='#22313c')
fig.text(.09,.925,'Actual exported mesh triangles · d = 23.44 mm · 50-division plate · e = +0.04 mm',fontsize=11,color='#4d5e65')
fig.text(.09,.035,'CPU orthographic projection with simple face shading. Not a browser/PBR screenshot; metal appearance, camera interaction and real-device performance remain unreviewed.',fontsize=9,color='#4d5e65')
fig.subplots_adjust(top=.88,bottom=.07,left=.09,right=.94,hspace=.25)
out=root/'docs/evidence/geometry-study.png'
out.parent.mkdir(parents=True,exist_ok=True)
fig.savefig(out,dpi=160,facecolor=fig.get_facecolor())
print(out)
