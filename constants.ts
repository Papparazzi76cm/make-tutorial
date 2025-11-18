import { Topic } from './types';
import { Zap, GitMerge, Globe, Database, Settings, Code, Box, Layers } from 'lucide-react';

export const SYSTEM_INSTRUCTION = `Eres un experto tutor en la plataforma de automatización "Make" (anteriormente Integromat).
Tu objetivo es enseñar al usuario a crear automatizaciones paso a paso.
Adaptas tu lenguaje al nivel del usuario (Principiante, Intermedio, Experto).
Siempre proporciona ejemplos prácticos.
Si el usuario pregunta sobre código (JSON, XML, JavaScript en Make), usa bloques de código markdown.

REGLA DE ORO - VISUALIZACIÓN:
El usuario quiere ver diagramas, NO leer descripciones de cómo se ven.
1. ESTÁ PROHIBIDO escribir "Resumen Visual" o listas de texto describiendo círculos y flechas.
2. ES OBLIGATORIO generar una imagen para CADA paso importante o configuración de flujo.
3. Si explicas un proceso de 3 pasos, debes generar 3 imágenes (una por paso) insertando la etiqueta correspondiente.

Para generar una imagen, inserta esta etiqueta en una línea nueva justo después de explicar el concepto:
[GENERAR_IMAGEN: descripción técnica en inglés del diagrama de Make.com, estilo minimalista vector UI]

Ejemplo de flujo correcto:
"Primero configuramos el trigger de Google Sheets...
[GENERAR_IMAGEN: Make.com module Google Sheets green circle trigger]
Luego conectamos el router...
[GENERAR_IMAGEN: Make.com router module dividing flow into two paths]"

Sé amigable, paciente y muy técnico cuando se requiera.
Usa formato Markdown para estructurar tus respuestas.`;

export const CURRICULUM: Topic[] = [
  {
    id: 'intro',
    title: 'Introducción a Make',
    description: 'Conceptos básicos: Escenarios, Módulos y Triggers.',
    difficulty: 'Beginner',
    icon: 'Zap',
    initialPrompt: 'Hola, soy nuevo en Make. Explícame paso a paso los conceptos básicos y genera una imagen para cada concepto (Escenario, Módulo, Trigger).'
  },
  {
    id: 'data-structures',
    title: 'Mapeo de Datos & Tipos',
    description: 'Aprende a mover datos entre módulos y usar variables.',
    difficulty: 'Beginner',
    icon: 'Box',
    initialPrompt: 'Quiero aprender a mapear datos. Muestrame paso a paso con imágenes cómo se conectan los datos de un módulo a otro.'
  },
  {
    id: 'routers-filters',
    title: 'Routers y Filtros',
    description: 'Lógica condicional para bifurcar tus automatizaciones.',
    difficulty: 'Intermediate',
    icon: 'GitMerge',
    initialPrompt: 'Enséñame a usar un Router. Genera un diagrama visual del flujo antes y después de añadir el router.'
  },
  {
    id: 'http-apis',
    title: 'HTTP y APIs',
    description: 'Conecta cualquier servicio usando el módulo HTTP.',
    difficulty: 'Intermediate',
    icon: 'Globe',
    initialPrompt: '¿Cómo configuro un módulo HTTP para un GET? Muestrame la configuración con una imagen generada.'
  },
  {
    id: 'iterators-aggregators',
    title: 'Iteradores y Agregadores',
    description: 'Manejo avanzado de Arrays y colecciones de datos.',
    difficulty: 'Expert',
    icon: 'Layers',
    initialPrompt: 'Diferencia entre Iterador y Agregador. Ilustra cada uno con un diagrama generado.'
  },
  {
    id: 'error-handling',
    title: 'Manejo de Errores',
    description: 'Directivas de error: Resume, Ignore, Break, Rollback.',
    difficulty: 'Expert',
    icon: 'Settings',
    initialPrompt: 'Explica las directivas de error. Genera una imagen que muestre dónde se configura esto en el módulo.'
  },
  {
    id: 'custom-apps',
    title: 'Apps Personalizadas',
    description: 'Creación de apps propias usando JSON/API Key.',
    difficulty: 'Expert',
    icon: 'Code',
    initialPrompt: 'Pasos para crear una App personalizada en Make. Ilustra la interfaz de My Apps.'
  }
];