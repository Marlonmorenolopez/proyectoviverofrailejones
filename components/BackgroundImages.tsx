export function BackgroundImages() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <img
        src="/images/frailejones.png"
        alt="Frailejón"
className="absolute top-0 left-0 w-full h-full object-cover opacity-75"
      />
     /
      <img
        src="/images/paramo-plant.png"
        alt="Planta nativa"
        className="absolute bottom-10 right-10 w-36 h-auto opacity-75"
      />
      <img
        src="/images/paramo-flower.png"
        alt="Flor de páramo"
        className="absolute top-1/2 right-20 w-32 h-auto opacity-75"
      />
    </div>
  )
}