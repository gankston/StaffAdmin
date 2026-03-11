export interface Sector {
  id: number;
  name: string;
  employees: number;
  state: 'sent' | 'missing';
  icon: string;
  encargado: string;
  trend: number;
}

let mockSectors: Sector[] = [
  { id: 1, name: "Ingeniería", employees: 142, state: "sent", icon: "Cpu", encargado: "Carlos Mendoza", trend: 4.2 },
  { id: 2, name: "Operaciones", employees: 87, state: "missing", icon: "Truck", encargado: "Laura Ríos", trend: -1.5 },
  { id: 3, name: "Recursos Humanos", employees: 34, state: "sent", icon: "Users", encargado: "Diana Paredes", trend: 2.8 },
  { id: 4, name: "Finanzas", employees: 61, state: "missing", icon: "DollarSign", encargado: "Tomás Guerrero", trend: -3.1 },
  { id: 5, name: "I+D", employees: 55, state: "sent", icon: "FlaskConical", encargado: "Sofía Vargas", trend: 6.8 },
  { id: 6, name: "Soporte al Cliente", employees: 98, state: "missing", icon: "Headphones", encargado: "Miguel Ángel Torres", trend: -2.3 },
];

export function initDB() {
  console.log('Using in-memory mock DB since real API is external');
}

export function getSectors(): Sector[] {
  return mockSectors;
}

export function toggleSectorState(id: number): Sector[] {
  mockSectors = mockSectors.map(s => {
    if (s.id === id) {
      return { ...s, state: s.state === 'sent' ? 'missing' : 'sent' };
    }
    return s;
  });
  return mockSectors;
}
