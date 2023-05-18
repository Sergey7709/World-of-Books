import { Group, Grid, Modal, Flex, Title } from "@mantine/core";
import { useStyles } from "./BooksListStyles";
import { useMutation, useQuery } from "react-query";
import { fetchItem } from "../../api/itemsApi";
import { Item, ItemsResponse, User } from "../../common/types";
import { useAppSelector } from "../../redux/redux.hooks";
import { Loader } from "../../components/loader/Loader";
import { BooksFilter } from "./BooksFilter";
import SingleBookList from "./SingleBookList";
import PriceRange from "./BooksPriceRange";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ServerError } from "../../components/errorNetwork/ServerError";
import { useCurrentUser } from "../../hooks/useCurrenUser";
import axios from "axios";
import { BASE_URL } from "../../common/constants";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { Authorization } from "../authorization/Authorization";

export const BooksList = React.memo(() => {
  const getCurrentUser = useCurrentUser(); //!
  const user: User | null = useAppSelector((stateAuth) => stateAuth.auth.user); //!
  const [openedAuth, handlers] = useDisclosure(false); //!

  const [value, setValue] = useState("");

  const [sortMinMaxPrice, setSortMinMaxPrice] = useState<Array<number>>([]); //!
  const [minPrice, maxPrice] = sortMinMaxPrice; //!
  const [maxDiscount, setMaxDiscount] = useState<number>(0); //!
  const [idLoad, setIdLoad] = useState<Array<number>>([]); //!

  const param = useAppSelector((state) => state.filter.param);
  const { classes } = useStyles();
  const categoryNewBooks = "all?sortBy=releaseDate&sortOrder=desc&limit=8";

  const priceSort =
    minPrice > 0
      ? `&priceFrom=${minPrice}&priceTo=${maxPrice + maxDiscount}`
      : ""; //!

  const sortLink = param === categoryNewBooks ? categoryNewBooks : param;

  const { data, isLoading, isLoadingError } = useQuery<ItemsResponse>(
    ["item", param, value, priceSort],
    () => fetchItem(`${sortLink}${value}${priceSort}`)
  ); //!

  useEffect(() => {
    data?.items
      ?.filter((book) => book.discount > 0)
      .reduce((minDiscount, book) => {
        const newMinDiscount =
          book.discount > minDiscount ? book.discount : minDiscount;
        setMaxDiscount(newMinDiscount);
        return newMinDiscount;
      }, 0);
  }, [data]);

  // console.log("maxDiscount:", maxDiscount);
  // console.log(priceSort);
  // console.log(data);
  // console.log(sortMinMaxPrice);

  const dataDiscount = useMemo(
    () =>
      data?.items.filter((book) => {
        if (book.discount !== 0) {
          return book.discount >= minPrice && book.discount <= maxPrice;
        } else {
          return book.price >= minPrice && book.price <= maxPrice;
        }
      }),
    [data?.items]
  ); //!

  // console.log("minPrice", minPrice, "maxPrice", maxPrice);
  // console.log("dataDiscount", dataDiscount);
  // console.log("массив с учетом скидки:", dataDiscount);

  //!----

  // console.log("idLoad:", idLoad);

  const { mutateAsync, isLoading: loading } = useMutation(
    (param: string) => {
      // console.log("mutate:", param, "token:", user?.token, user?.favoriteItems);
      return axios.post(`${BASE_URL}${param}`, undefined, {
        headers: {
          Authorization: user?.token ?? "",
        },
      });
    },
    {
      // onSuccess: () => {},
      onError: () => {
        notifications.show({
          message: "Ошибка при добавлении или удалении книги в избранном!",
          autoClose: 2000,
          color: "red",
        });
      },
    }
  );

  const favoritesChange = useCallback(
    async (bookId: number, favorite: boolean) => {
      setIdLoad([...idLoad, bookId]); //!

      if (!user) {
        notifications.show({
          message: "Войдите в аккаунт, что бы добавить книгу в избранное!",
          autoClose: 5000,
          color: "red",
          fz: "md",
        });

        handlers.open();
        return;
      }

      if (user) {
        if (favorite === false) {
          await mutateAsync(`user/favorites/${bookId}`, {});
        } else if (favorite === true) {
          await mutateAsync(`user/favorites-remove/${bookId}`, {});
        }

        getCurrentUser();
        setIdLoad((idLoad) => idLoad.filter((el) => el !== bookId)); //!
      }
    },
    [idLoad, user, handlers, getCurrentUser, mutateAsync]
  );

  const books = useMemo(() => {
    const filteredBooks = minPrice > 0 ? dataDiscount : data?.items; //!
    return filteredBooks?.map(
      (
        book: Item //!
      ) => (
        <SingleBookList
          favorite={
            user?.favoriteItems.some((el) => el.id === book.id) ?? false
          }
          book={book}
          key={book.id}
          favoritesChange={favoritesChange}
          loading={idLoad.includes(book.id) ? loading : false}
        />
      )
    );
  }, [
    data?.items,
    dataDiscount,
    favoritesChange,
    idLoad,
    loading,
    minPrice,
    user?.favoriteItems,
  ]); //!

  //!---

  const sortHandler = useCallback((value: string) => {
    setValue(value);
  }, []);

  const handlePriceChange = useCallback(
    (priceMin: number, priceMax: number) => {
      setSortMinMaxPrice([priceMin, priceMax]);
    },
    []
  ); //!

  // console.log("render BookList");
  // console.log("избранных книг:", user?.favoriteItems);
  // loading && console.log("load");

  return (
    <>
      {isLoading && <Loader />}
      {isLoadingError && <ServerError />}
      {!isLoading && param === categoryNewBooks && (
        <Flex justify={"center"} align={"center"}>
          <Title color="green" order={1}>
            КНИЖНЫЕ НОВИНКИ
          </Title>
        </Flex>
      )}
      <Grid>
        <Modal size={500} opened={openedAuth} onClose={handlers.close} centered>
          <Authorization close={handlers.close} />
        </Modal>
        <Grid.Col span={12}>
          <Group ml={"2%"} mb={5}>
            {param !== categoryNewBooks && (
              <>
                <BooksFilter sortHandler={sortHandler} />
                <PriceRange onPriceChange={handlePriceChange} />
              </>
            )}
          </Group>
        </Grid.Col>
        <Grid.Col span={12}>
          <Grid className={classes.grid} align="center">
            {data && books}
          </Grid>
        </Grid.Col>
      </Grid>
    </>
  );
});
