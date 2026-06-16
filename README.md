# MERN SecOps Lab : Secured by Design

Ce dépôt regroupe mon lab SecOps. L'idée est simple : prendre une stack MERN classique et la pousser en production sur Kubernetes en appliquant une sécurité stricte à chaque étape (moindre privilège et défense en profondeur), plutôt que de patcher la sécurité à la fin.

---

## 🎯 Ma Feuille de Route
Le projet avance par blocs logiques. Je valide un pilier technique avant de passer au suivant :
- [x] **1) Sécuriser les conteneurs (Docker)** 🐳 -> *Optimisation du poids des images et suppression des privilèges root.*
- [ ] **2) Automatiser les contrôles (CI/CD)** 🛠️ -> *Standardisation des builds et scans de vulnérabilités à chaque commit.* **[Focus Actuel]**

---

## 🪵 Choix & Retours d'Expérience
### 🐳 Durcissement des conteneurs
* **Le problème :** Mon image de base (Ubuntu) faisait plus d'1 Go et tournait par défaut en `root`. Cela posait un double problème : des temps de build/déploiement trop longs en CI/CD et une plus grande surface d'attaque
* **Ma solution :** Passage au *Multi-stage build*, ajout d'un USER non root et coté frontend utilisation d'une image nginx avec moins de privilège
* **Le gain DevOps & SecOps :** L'image finale pèse quelques Mo, ce qui accélère drastiquement le déploiement, Côté sécurité, l'absence d'outils (`curl`, `apt`, `bash`) et l'exécution en `USER nonroot` bloquent toute compromission du système

### 🛠️ Pipeline CI/CD et sécurité "Shift-Left" — [En cours]

---
