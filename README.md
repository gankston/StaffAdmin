# StaffAdmin 🏛️

> [!IMPORTANT]
> **StaffAdmin** es la pieza central de gestión del ecosistema StaffAxis. Funciona en sincronía directa con la **[App Móvil StaffAxis](https://github.com/gankston/StaffAxis)**. Mientras la App recolecta las asistencias en el campo, StaffAdmin centraliza, procesa y genera los reportes necesarios para la toma de decisiones.

[Español](#español) | [English](#english)

---

## Español

Panel de control administrativo avanzado para la gestión de personal y asistencia, diseñado para centralizar la información recolectada por el ecosistema StaffAxis.

### 🌐 Infraestructura del Ecosistema
- **API Propia**: La aplicación consume una API personalizada alojada en **Cloudflare Workers**, desarrollada específicamente para este flujo de trabajo.
- **Turso DB (libSQL)**: El backend utiliza **Turso** como base de datos en la nube, permitiendo que StaffAdmin vea en tiempo real lo que sucede en la aplicación móvil de los empleados.
- **Gestión Unificada**: Permite administrar sectores, empleados y horarios de forma global, impactando instantáneamente en todo el ecosistema.

### 🚀 Características
- **Supervisión de Sectores**: Monitoreo en tiempo real de múltiples áreas operativas.
- **Exportación Avanzada**: Generación de reportes de asistencia en Excel con filtros por sector y períodos personalizados (21 al 20).
- **Gestión de RRHH**: Alta, baja y modificación de empleados y sectores con impacto inmediato en la App móvil.
- **Estadísticas de Personal**: Visualización de empleados registrados, activos y ausentes por período.
- **Tecnología de Escritorio**: Aplicación robusta basada en Electron para entornos Windows.

### 🛠️ Stack Tecnológico
- **Frontend**: React + TypeScript
- **Backend/API**: Cloudflare Workers (API Personalizada)
- **Base de Datos**: Turso (libSQL Cloud)
- **Desktop**: Electron
- **Estilos**: Tailwind CSS + Radix UI

---

## English

An advanced administrative dashboard for personnel and attendance management, designed to centralize information collected by the StaffAxis ecosystem.

### 🌐 Ecosystem Infrastructure
- **Custom API**: The application consumes a custom API hosted on **Cloudflare Workers**, specifically developed for this workflow.
- **Turso DB (libSQL)**: The backend utilizes **Turso** as a cloud database, allowing StaffAdmin to see in real-time what is happening in the employees' mobile app.
- **Unified Management**: Manage sectors, employees, and schedules globally, impacting the entire ecosystem instantly.

### 🚀 Key Features
- **Sector Supervision**: Real-time monitoring of multiple operational areas.
- **Advanced Exporting**: Generation of Excel attendance reports with filters by sector and custom periods (21st to 20th).
- **HR Management**: Create, update, and delete employees and sectors with immediate impact on the mobile App.
- **Personnel Statistics**: Visualization of registered, active, and absent employees per period.
- **Desktop Technology**: Robust Electron-based application for Windows environments.

### 🛠️ Tech Stack
- **Frontend**: React + TypeScript
- **Backend/API**: Cloudflare Workers (Custom API)
- **Database**: Turso (libSQL Cloud)
- **Desktop Framework**: Electron
- **Styling**: Tailwind CSS + Radix UI

---
Developed with ❤️ by gankston