import ReaderT from "crocks/Reader/ReaderT";
import Async, { fromPromise, fromNode } from "crocks/Async";
import { path } from "ramda";
import got from "got";
import { writeFile } from "fs";
import { ifError, equal } from "assert";

const AsyncReader = ReaderT(Async);

const client = got.extend({
  json: true,
  hooks: {
    beforeRequest: [
      () => {
        console.log("About to make a request");
      }
    ]
  }
});

const env = {
  gotAsync: fromPromise(client),
  filename: "ip.txt"
};

const writeFileAsync = fromNode(writeFile);

const fetchUrl = url => AsyncReader(({ gotAsync }) => gotAsync({ url }));
const writeToFile = data =>
  AsyncReader(({ filename }) => writeFileAsync(filename, data));

const getIp = fetchUrl("https://jsonip.com/")
  .map(path(["body"]))
  .map(path(["ip"]));

getIp
  .chain(writeToFile)
  .runWith(env)
  .fork(
    () => console.error("WRONG"),
    () => console.log("done")
  );

const response = {
  body: {
    ip: "174.236.1.19"
  }
};
const fakeGot = () => Async.of(response);
getIp
  .runWith({ gotAsync: fakeGot })
  .fork(ifError, ip => equal(ip, "174.236.1.19"));

const asPromise = async () => {
  const localGot = () =>
    Async.of({
      body: {
        ip: "127.0.0.1"
      }
    });
  const localIp = await getIp.runWith({ gotAsync: localGot }).toPromise();
  console.log(`My local IP is: ${localIp}`);
};

asPromise();
