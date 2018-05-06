# create-mobx-container

Create react [container](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) components without worrying about react itself.

```jsx
// react-free state and logic
class Counter {
  @observable value;

  @action
  increment = () => {
    this.value++;
  };

  @action
  decrement = () => {
    this.value--;
  };
}

// turn your state and logic into a react higher-order component
const CounterContainer = createContainer({
  createStore: () => new Counter(),
  mapStoreToProps: store => ({
    value: store.value,
    increment: store.increment,
    decrement: store.decrement
  })
});

// make a plain react presentational component
const CounterPresenter = ({ value, increment, decrement }) => (
  <div>
    <span>{value}</span>
    <button onClick={increment}>+</button>
    <button onClick={decrement}>-</button>
  </div>
);

// combine them into a new component that requires no props
const CounterComponent = CounterContainer(CounterPresenter);

// render the component
const App = () => <CounterComponent />;
```
