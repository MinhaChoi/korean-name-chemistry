const EMBER_COUNT = 14;

// 서버와 클라이언트가 같은 마크업을 그려야 하므로 Math.random() 대신,
// 인덱스로부터 계산되는 결정론적인 값으로 흩어진 것처럼 보이는 배치를 만든다.
function emberAt(index: number) {
  return {
    left: ((index * 37) % 96) + 2,
    size: 2 + (index % 3),
    duration: 2.5 + (index % 5) * 0.5,
    delay: (index % 7) * 0.5,
  };
}

export function EmberParticles() {
  const embers = Array.from({ length: EMBER_COUNT }, (_, i) => emberAt(i));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {embers.map((ember, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-orange-400"
          style={{
            left: `${ember.left}%`,
            bottom: 0,
            width: ember.size,
            height: ember.size,
            boxShadow: "0 0 6px 1px rgba(255,150,40,0.9)",
            animation: `ember-rise ${ember.duration}s ease-in ${ember.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
