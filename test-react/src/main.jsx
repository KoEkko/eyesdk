function Child() {
  const list = {};
  return (
    <>
      {list.map((val) => {
        return <span key={val}>{val}</span>;
      })}
    </>
  );
}

function TestError({ name }) {
  return (
    <>
      <div>hello :{name}</div>
    </>
  );
}

export default function Main() {
  return (
    <>
      <Child />
      <TestError name="world" />
    </>
  );
}
