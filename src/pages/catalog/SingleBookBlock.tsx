import React, { FC, useCallback, useEffect, useState } from "react";
import { Item } from "../../common/types";
import { useStyles } from "./BooksListStyles";
import { useAppDispatch } from "../../redux/redux.hooks";
import { addCartItems } from "../../redux/cartSlice";

import { SingleBookBlockLayout } from "./SingleBookBlockLayout";

type SingleBookListProps = {
  book: Item;
  favorite: boolean;
  favoritesChange: (bookId: number, favorite: boolean) => void;
};
const SingleBookBlock: FC<SingleBookListProps> = React.memo(
  ({ book, favorite, favoritesChange }) => {
    const [favoriteState, setFavoriteState] = useState(favorite);

    const dispatch = useAppDispatch();

    const handleFavoritesChange = useCallback(() => {
      setFavoriteState(!favoriteState);
      favoritesChange(book.id, favoriteState);
    }, [book.id, favoriteState, favoritesChange]);

    const handleAddCartItem = () => {
      // console.log("Добавлен товар в корзину", book);
      dispatch(addCartItems(book));
    };

    const { id, discount, reviews, price } = book;
    const { classes } = useStyles();

    useEffect(() => {
      setFavoriteState(favorite);
    }, [favorite]);

    console.log("render single");

    return (
      <>
        <SingleBookBlockLayout
          id={id}
          classes={classes}
          book={book}
          discount={discount}
          price={price}
          reviews={reviews}
          favoriteState={favoriteState}
          handleFavoritesChange={handleFavoritesChange}
          handleAddCartItem={handleAddCartItem}
        />
      </>
    );
  }
);

export default React.memo(SingleBookBlock);
