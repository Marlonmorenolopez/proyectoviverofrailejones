import * as Toast from "@radix-ui/react-toast";

export default () => (
  <Toast.Provider>
    <Toast.Root>
      {/* Título de la notificación */}
      <Toast.Title>Notificación Importante</Toast.Title>

      {/* Descripción de la notificación */}
      <Toast.Description>
        Esta es una descripción detallada de la notificación.
      </Toast.Description>

      {/* Acción del Toast, se requiere 'altText' */}
      <Toast.Action altText="Deshacer la acción anterior">
        Deshacer
      </Toast.Action>

      {/* Botón para cerrar la notificación */}
      <Toast.Close>Cerrar</Toast.Close>
    </Toast.Root>

    {/* Vista del Toast en la pantalla */}
    <Toast.Viewport />
  </Toast.Provider>
);
