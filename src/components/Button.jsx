function Button({ children, variant = 'primary', ...props }) {
  const className =
    variant === 'primary'
      ? 'button-primary'
      : 'button-secondary';

  return (
    <button className={`${className} inline-flex`} {...props}>
      {children}
    </button>
  );
}

export default Button;
