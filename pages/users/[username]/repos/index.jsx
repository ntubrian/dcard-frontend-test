import { useRouter } from "next/router";
import { useEffect, useState, useContext } from "react";
import { UserContext, ACTION_TYPES } from "context/github-user-context";
import { List, Skeleton, Divider } from "antd";
import Back from "components/Back";
import InfiniteScroll from "react-infinite-scroll-component";
import "antd/dist/antd.css";
import Image from "next/image";
import Head from "next/head";
import Link from "next/link";
import style from "styles/repos.module.css";
import { getOneUserMeta } from "lib/getOneUserMeta";
import LocalScrollToTop from "components/LocalScrollToTop";
import ReposList from "components/ReposList";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export async function getServerSideProps(context) {
  // console.log(process.env.VERCEL_URL);
  const baseURL =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : `https://${process.env.VERCEL_URL}`;

  const FirstReposReq = await (
    await fetch(
      `${baseURL}/api/getUserRepos?username=${context.query.username}&page=${1}`
    )
  ).json();

  // const result = await response.json();

  // console.log("###Result", reposResult);

  const arr = Array(10).fill(0);
  // console.log(context.query);

  FirstReposReq.data.forEach((element) => {
    arr.push(element.id);
  });
  // console.log(arr);

  // setId(idArr.concat(arr));
  // setUserReposMeta(userReposMeta.concat(reposResult.data));
  // setLoading(false);

  return {
    props: {
      arr,
      FirstReposReq,
      ...(await serverSideTranslations(context.locale, ["common"])),
    }, // will be passed to the page component as props
  };
}

const Repos = ({ arr, FirstReposReq }) => {
  const routerProps = useRouter();
  const [userName, setUserName] = useState(routerProps.query.username);
  const [publicRepoLength, setPublicRepoLength] = useState(
    routerProps.query.public_repos
  );
  const [isBigScreen, setBigScreen] = useState(0);
  const [idArr, setId] = useState(arr);

  const { indexPageState, dispatch } = useContext(UserContext);
  const [userReposMeta, setUserReposMeta] = useState(FirstReposReq.data);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(2);
  const { t } = useTranslation("common");
  const baseURL =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  useEffect(async () => {
    setBigScreen(window.innerWidth > 600);
    const userMeta = await getOneUserMeta(
      sessionStorage.getItem("inputUserName")
    );
    sessionStorage.setItem("userRealName", userMeta?.data?.name);
    sessionStorage.setItem("selectedUserFollowers", userMeta?.data?.followers);
    dispatch({
      type: ACTION_TYPES.SET_USER_REAL_NAME,
      payload: { userRealName: userMeta?.data?.name },
    });
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_USER_FOLLOWERS,
      payload: { selectedUserFollowers: userMeta?.data.followers },
    });
  }, []);

  // 跳到這個route才設定inputUserName可能有點怪？
  // **更 到Results.js 那邊設定

  const ContainerHeight = 400;
  const onScroll = (e) => {
    if (e.target.scrollHeight - e.target.scrollTop === ContainerHeight) {
      setPage((prev) => prev + 1);
      fetchRepos();
    }
  };
  const setSeletedRepoContext = (item) => {
    sessionStorage.setItem("selectedRepoName", item.name);
    sessionStorage.setItem("selectedRepoNodeId", item.node_id);
    sessionStorage.setItem("selectedRepoDescription", item.description);
    sessionStorage.setItem("selectedRepoStarCounts", item.stargazers_count);
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_REPO_NAME,
      payload: { selectedRepoName: item.name },
    });
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_REPO_NODE_ID,
      payload: { selectedRepoNodeId: item.node_id },
    });
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_REPO_DESCRIPTION,
      payload: { selectedRepoDescription: item.description },
    });
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_REPO_STAR_COUNTS,
      payload: { selectedRepoStarCounts: item.stargazers_count },
    });
    // dispatch({
    //   type: ACTION_TYPES.SET_USER_AVATAR_URL,
    //   payload: { userAvatarUrl: [meta.data.avatar_url] },
    // });
  };
  const fetchRepos = async () => {
    if (loading) {
      return;
    }
    setPage((prev) => prev + 1);
    setLoading(true);
    try {
      const reposResult = await (
        await fetch(
          `/api/getUserRepos?username=${sessionStorage.getItem(
            "inputUserName"
          )}&page=${page}`
        )
      ).json();
      // const result = await response.json();

      // console.log("###Result", reposResult);

      const arr = [];

      reposResult.data.forEach((element) => {
        arr.push(element.id);
      });

      setId(idArr.concat(arr));
      setUserReposMeta(userReposMeta.concat(reposResult.data));
      setLoading(false);
    } catch (error) {
      console.error("Error here", error);

      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch({
      type: ACTION_TYPES.SET_INPUT_USER_NAME,
      payload: { inputUserName: sessionStorage.getItem("inputUserName") },
    });
    dispatch({
      type: ACTION_TYPES.SET_USER_REAL_NAME,
      payload: { userRealName: sessionStorage.getItem("userRealName") },
    });
    dispatch({
      type: ACTION_TYPES.SET_USER_AVATAR_URL,
      payload: { userAvatarUrl: [sessionStorage.getItem("userAvatarUrl")] },
    });
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_USER_FOLLOWERS,
      payload: {
        selectedUserFollowers: sessionStorage.getItem("selectedUserFollowers"),
      },
    });
    // fetchRepos();
    setUserName(routerProps.query.username);
    setPublicRepoLength(routerProps.query.public_repos);
  }, [userName, routerProps]);
  return (
    <div className={style.outerContainer}>
      <Head>
        <title>{`${userName}'s github repos`}</title>
        <meta name="description" content={`${userName}'s github repos`}></meta>
      </Head>
      <div className={style.navContainer}>
        <Back backTo={routerProps.back}></Back>
      </div>
      <div className={style.profileContainer}>
        <div className={style.picContainer}>
          <Image
            src={
              indexPageState?.userAvatarUrl?.length > 0
                ? indexPageState?.userAvatarUrl[0]
                : "https://c.tenor.com/I6kN-6X7nhAAAAAi/loading-buffering.gif"
            }
            width={isBigScreen ? 276 : 180}
            height={isBigScreen ? 276 : 180}
            layout="fixed"
            objectFit="cover"
            className={style.circleAvatar}
          ></Image>
        </div>
        {indexPageState.userRealName !== "null" && (
          <h2>{indexPageState.userRealName}</h2>
        )}
        <p>{indexPageState.inputUserName}</p>
        <p>👥{`${indexPageState.selectedUserFollowers} ` + t("follower")}</p>
      </div>

      <div className={style.reposContainer}>
        <div
          id="scrollableDiv"
          className={style.scroll}
          style={{
            height: isBigScreen ? 320 : 200,
            width: "55vw",
            overflow: "auto",
            padding: "0 10px",
            border: "2px solid rgba(140, 140, 140, 0.45)",
          }}
        >
          <LocalScrollToTop
            bottomPosition={1}
            rightPosition={1}
            id="scrollableDiv"
          ></LocalScrollToTop>

          <InfiniteScroll
            dataLength={userReposMeta.length}
            next={fetchRepos}
            hasMore={userReposMeta.length < publicRepoLength}
            loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
            endMessage={<Divider plain>{t("its_all")} 🤐</Divider>}
            scrollableTarget="scrollableDiv"
          >
            <List
              dataSource={userReposMeta}
              locale={{
                emptyText:
                  publicRepoLength > 0
                    ? `${t("loading")}`
                    : `${t("this_guy_not_leave")}`,
              }}
              renderItem={(item) => (
                <Link
                  href={`/users/${
                    userName
                      ? userName
                      : sessionStorage.getItem("inputUserName")
                  }/repos/${
                    item.name
                      ? item.name
                      : sessionStorage.getItem("selectedRepoName")
                  }@${
                    item.node_id
                      ? item.node_id
                      : sessionStorage.getItem("selectedRepoNodeId")
                  }`}
                  passHref
                >
                  <ReposList idArr={idArr} item={item} />
                  {/* <List.Item
                    key={item.id}
                    onClick={() => setSeletedRepoContext(item)}
                    className={`${style.listItem} ${
                      Math.floor(idArr.indexOf(item.id) / 10) % 2 == 1
                        ? style.oddGroupPage
                        : style.evenGroupPage
                    }`}
                  >
                    <List.Item.Meta
                      title={<p className={style.title}>{item.name}</p>}
                    />
                    <div
                      className={style.starContext}
                    >{`⭐${item.stargazers_count}`}</div>
                  </List.Item> */}
                </Link>
              )}
            />
          </InfiniteScroll>
        </div>
      </div>
    </div>
  );
};

export default Repos;
