import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
// import Button from '@mui/material/Button';

export default function Loader() {
//   const [open, setOpen] = React.useState(false);
//   const handleClose = () => {
//     setOpen(false);
//   };
//   const handleOpen = () => {
//     setOpen(true);
//   };

  return (
    <div>
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open={true}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
}