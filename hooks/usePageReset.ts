import { useDispatch } from "react-redux";
import { resetSession } from "@/redux/sessionSlice";
import { resetView } from "@/redux/viewSlice";
import { resetMap } from "@/redux/mapSlice";

const usePageReset = () => {
  const dispatch = useDispatch();

  const resetAll = () => {
    dispatch(resetSession());
    dispatch(resetView());
    dispatch(resetMap());
  };

  return resetAll;
};

export default usePageReset;
