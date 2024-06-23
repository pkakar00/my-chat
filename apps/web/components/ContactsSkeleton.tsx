import { List, ListItem, Skeleton, Typography } from "@mui/material";

export default function ContactsSkeleton() {
  return (
    <div className="db-item-contacts">
      <Typography sx={{ color: "white", paddingLeft: "2%" }} variant="h4">
        Chats
      </Typography>
      <br />
      <List>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((x) => (
          <ListItem alignItems="flex-start" key={x}>
            <Skeleton
              className="contact light-background curved-edges"
              variant="rectangular"
              height={60}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}
